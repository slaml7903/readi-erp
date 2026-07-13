import "server-only";

import { unstable_cache } from "next/cache";

import { AirtableRepositoryError } from "@/lib/airtable/errors/airtable-repository.error";
import { revalidateCacheTags } from "@/lib/cache/revalidate";

const DEFAULT_REVALIDATE_SECONDS = 30;
const DEFAULT_PAGE_SIZE = 100;
const AIRTABLE_MAX_PAGE_SIZE = 100;

export type AirtableSortOption = {
  field: string;
  direction?: "asc" | "desc";
};

export type AirtableQueryOptions = {
  baseId?: string;
  cache?: RequestCache;
  revalidate?: number;
  tags?: string[];
  fields?: string[];
  filterByFormula?: string;
  sort?: AirtableSortOption[];
  maxRecords?: number;
  pageSize?: number;
  view?: string;
};

export type AirtableMutationOptions = {
  baseId?: string;
  typecast?: boolean;
  revalidateTags?: string[];
};

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

type AirtableResponse = {
  records: AirtableRecord[];
  offset?: string;
};

type AirtableCreateRecordsResponse = {
  records: AirtableRecord[];
};

type AirtableRequestContext = {
  operation: string;
  tableName?: string;
  recordId?: string;
};

type AirtableFetchAllCacheKey = {
  tableName: string;
  baseId?: string;
  fields?: string[];
  filterByFormula?: string;
  sort?: AirtableSortOption[];
  maxRecords?: number;
  pageSize?: number;
  view?: string;
};

export type AirtableUploadFileInput = {
  filename: string;
  contentType: string;
  file: string;
};

function getAirtableToken() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

  if (!token) {
    throw new Error("AIRTABLE_PERSONAL_ACCESS_TOKEN is not defined");
  }

  return token;
}

function getDefaultAirtableBaseId() {
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!baseId) {
    throw new Error("AIRTABLE_BASE_ID is not defined");
  }

  return baseId;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function createAirtableUrl(tableName: string, baseIdOverride?: string) {
  const baseId = baseIdOverride ?? getDefaultAirtableBaseId();

  return new URL(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePositiveInteger(value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value <= 0) return undefined;
  return value;
}

function normalizePageSize(pageSize: number | undefined) {
  const positivePageSize = normalizePositiveInteger(pageSize);

  if (!positivePageSize) return DEFAULT_PAGE_SIZE;

  return Math.min(positivePageSize, AIRTABLE_MAX_PAGE_SIZE);
}

function createNextOptions(
  tableName: string,
  options: Pick<AirtableQueryOptions, "revalidate" | "tags">
) {
  const tags = options.tags?.filter(isNonEmptyString);

  return {
    revalidate:
      normalizePositiveInteger(options.revalidate) ?? DEFAULT_REVALIDATE_SECONDS,
    tags: tags && tags.length > 0 ? tags : [`airtable-${tableName}`],
  };
}

function createCacheTags(
  tableName: string,
  options: Pick<AirtableQueryOptions, "tags">
) {
  const tags = options.tags?.filter(isNonEmptyString);

  return tags && tags.length > 0 ? tags : [`airtable-${tableName}`];
}

function createFetchAllCacheKey(
  tableName: string,
  options: AirtableQueryOptions
) {
  const cacheKey: AirtableFetchAllCacheKey = {
    tableName,
    baseId: options.baseId,
    fields: options.fields?.filter(isNonEmptyString),
    filterByFormula: isNonEmptyString(options.filterByFormula)
      ? options.filterByFormula
      : undefined,
    sort: options.sort?.filter((sortOption) =>
      isNonEmptyString(sortOption.field)
    ),
    maxRecords: normalizePositiveInteger(options.maxRecords),
    pageSize: normalizePageSize(options.pageSize),
    view: isNonEmptyString(options.view) ? options.view : undefined,
  };

  return JSON.stringify(cacheKey);
}

function shouldCacheFetchAllResult(options: AirtableQueryOptions) {
  return options.cache !== "no-store" && options.cache !== "reload";
}

function appendAirtableQueryOptions(
  url: URL,
  options: AirtableQueryOptions
) {
  const pageSize = normalizePageSize(options.pageSize);
  const maxRecords = normalizePositiveInteger(options.maxRecords);

  url.searchParams.set("pageSize", String(pageSize));

  if (maxRecords) {
    url.searchParams.set("maxRecords", String(maxRecords));
  }

  if (isNonEmptyString(options.filterByFormula)) {
    url.searchParams.set("filterByFormula", options.filterByFormula);
  }

  if (isNonEmptyString(options.view)) {
    url.searchParams.set("view", options.view);
  }

  options.fields?.filter(isNonEmptyString).forEach((field) => {
    url.searchParams.append("fields[]", field);
  });

  options.sort
    ?.filter((sortOption) => isNonEmptyString(sortOption.field))
    .forEach((sortOption, index) => {
    url.searchParams.set(`sort[${index}][field]`, sortOption.field);

    if (sortOption.direction) {
      url.searchParams.set(`sort[${index}][direction]`, sortOption.direction);
    }
  });
}

function appendMutationOptions(url: URL, options: AirtableMutationOptions) {
  if (options.typecast) {
    url.searchParams.set("typecast", "true");
  }
}

function createMutationRevalidationTags({
  tableName,
  recordId,
  options,
}: {
  tableName: string;
  recordId?: string;
  options: Pick<AirtableMutationOptions, "revalidateTags">;
}) {
  return [
    `airtable-${tableName}`,
    ...(recordId ? [`airtable-${tableName}-${recordId}`] : []),
    ...(options.revalidateTags ?? []),
  ];
}

async function requestAirtable<T>(
  url: URL,
  init: RequestInit,
  errorMessage: string,
  context: AirtableRequestContext
): Promise<T> {
  const token = getAirtableToken();

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const code = await getAirtableErrorCode(response);

    throw new AirtableRepositoryError(errorMessage, {
      status: response.status,
      code,
      operation: context.operation,
      tableName: context.tableName,
      recordId: context.recordId,
    });
  }

  return response.json() as Promise<T>;
}

async function getAirtableErrorCode(response: Response) {
  try {
    const body = (await response.clone().json()) as {
      error?: { type?: string; code?: string };
    };

    return body.error?.type ?? body.error?.code;
  } catch {
    return undefined;
  }
}

export async function airtableFetch(
  tableName: string,
  options: AirtableQueryOptions = {}
): Promise<AirtableResponse> {
  const cache = options.cache ?? "force-cache";
  const url = createAirtableUrl(tableName, options.baseId);

  appendAirtableQueryOptions(url, options);

  return requestAirtable<AirtableResponse>(
    url,
    {
      cache,
      next: createNextOptions(tableName, options),
    },
    "Failed to fetch Airtable data",
    { operation: "listRecords", tableName }
  );
}

export async function airtableFetchRecord(
  tableName: string,
  recordId: string,
  options: Pick<
    AirtableQueryOptions,
    "baseId" | "cache" | "fields" | "revalidate" | "tags"
  > = {}
): Promise<AirtableRecord> {
  const cache = options.cache ?? "force-cache";
  const url = createAirtableUrl(tableName, options.baseId);

  url.pathname = `${url.pathname}/${encodeURIComponent(recordId)}`;

  options.fields?.filter(isNonEmptyString).forEach((field) => {
    url.searchParams.append("fields[]", field);
  });

  return requestAirtable<AirtableRecord>(
    url,
    {
      cache,
      next: createNextOptions(tableName, {
        ...options,
        tags: options.tags ?? [
          `airtable-${tableName}`,
          `airtable-${tableName}-${recordId}`,
        ],
      }),
    },
    "Failed to fetch Airtable record",
    { operation: "getRecord", tableName, recordId }
  );
}

async function airtableFetchPage(
  tableName: string,
  offset: string | undefined,
  options: AirtableQueryOptions
): Promise<AirtableResponse> {
  const url = createAirtableUrl(tableName, options.baseId);

  appendAirtableQueryOptions(url, options);

  if (offset) {
    url.searchParams.set("offset", offset);
  }

  return requestAirtable<AirtableResponse>(
    url,
    {
      cache: "no-store",
    },
    "Failed to fetch Airtable data",
    { operation: "listRecordsPage", tableName }
  );
}

// Airtable offset is a short-lived iterator, so page responses must not be cached.
async function fetchAllAirtablePages(
  tableName: string,
  options: AirtableQueryOptions = {}
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  const seenOffsets = new Set<string>();
  const maxRecords = normalizePositiveInteger(options.maxRecords);
  const configuredPageSize = normalizePageSize(options.pageSize);
  let offset: string | undefined;

  do {
    const remainingRecords = maxRecords ? maxRecords - records.length : undefined;

    if (remainingRecords !== undefined && remainingRecords <= 0) break;

    const pageSize = Math.min(
      configuredPageSize,
      remainingRecords ?? AIRTABLE_MAX_PAGE_SIZE,
      AIRTABLE_MAX_PAGE_SIZE
    );
    const data = await airtableFetchPage(tableName, offset, {
      ...options,
      cache: "no-store",
      maxRecords: undefined,
      pageSize,
    });
    const nextOffset = data.offset;

    records.push(
      ...(remainingRecords
        ? data.records.slice(0, remainingRecords)
        : data.records)
    );

    if (maxRecords && records.length >= maxRecords) break;

    if (nextOffset) {
      if (seenOffsets.has(nextOffset)) {
        throw new Error(
          `Airtable pagination returned a repeated offset for table ${tableName}`
        );
      }

      seenOffsets.add(nextOffset);
    }

    offset = nextOffset;
  } while (offset);

  return records;
}

export async function airtableFetchAll(
  tableName: string,
  options: AirtableQueryOptions = {}
): Promise<AirtableRecord[]> {
  if (!shouldCacheFetchAllResult(options)) {
    return fetchAllAirtablePages(tableName, options);
  }

  // Cache only the fully merged records result, never the offset-bearing pages.
  return unstable_cache(
    () => fetchAllAirtablePages(tableName, options),
    ["airtable-fetch-all", createFetchAllCacheKey(tableName, options)],
    {
      revalidate:
        normalizePositiveInteger(options.revalidate) ??
        DEFAULT_REVALIDATE_SECONDS,
      tags: createCacheTags(tableName, options),
    }
  )();
}

export async function airtableCreateRecord(
  tableName: string,
  fields: Record<string, unknown>,
  options: AirtableMutationOptions = {}
): Promise<AirtableRecord> {
  const url = createAirtableUrl(tableName, options.baseId);

  appendMutationOptions(url, options);

  const record = await requestAirtable<AirtableRecord>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    },
    "Failed to create Airtable record",
    { operation: "createRecord", tableName }
  );

  await revalidateCacheTags(
    createMutationRevalidationTags({
      tableName,
      options,
    })
  );

  return record;
}

export async function airtableUpdateRecord(
  tableName: string,
  recordId: string,
  fields: Record<string, unknown>,
  options: AirtableMutationOptions = {}
): Promise<AirtableRecord> {
  const url = createAirtableUrl(tableName, options.baseId);

  url.pathname = `${url.pathname}/${encodeURIComponent(recordId)}`;

  appendMutationOptions(url, options);

  const record = await requestAirtable<AirtableRecord>(
    url,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    },
    "Failed to update Airtable record",
    { operation: "updateRecord", tableName, recordId }
  );

  await revalidateCacheTags(
    createMutationRevalidationTags({
      tableName,
      recordId,
      options,
    })
  );

  return record;
}

export async function airtableCreateRecords(
  tableName: string,
  records: Record<string, unknown>[],
  options: AirtableMutationOptions = {}
): Promise<AirtableRecord[]> {
  if (records.length === 0) return [];

  const createdRecords: AirtableRecord[] = [];
  const chunks = chunkArray(records, 10);

  for (const chunk of chunks) {
    const url = createAirtableUrl(tableName, options.baseId);

    appendMutationOptions(url, options);

    const data = await requestAirtable<AirtableCreateRecordsResponse>(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: chunk.map((fields) => ({
            fields,
          })),
        }),
      },
      "Failed to create Airtable records",
      { operation: "createRecords", tableName }
    );

    createdRecords.push(...data.records);
  }

  await revalidateCacheTags(
    createMutationRevalidationTags({
      tableName,
      options,
    })
  );

  return createdRecords;
}

export async function airtableUploadAttachment(
  recordId: string,
  attachmentFieldName: string,
  fileInput: AirtableUploadFileInput,
  options: Pick<AirtableMutationOptions, "baseId" | "revalidateTags"> = {}
): Promise<AirtableRecord> {
  const baseId = options.baseId ?? getDefaultAirtableBaseId();
  const url = new URL(
    `https://content.airtable.com/v0/${baseId}/${encodeURIComponent(
      recordId
    )}/${encodeURIComponent(attachmentFieldName)}/uploadAttachment`
  );

  const record = await requestAirtable<AirtableRecord>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileInput),
    },
    "Failed to upload Airtable attachment",
    { operation: "uploadAttachment", recordId }
  );

  await revalidateCacheTags(options.revalidateTags);

  return record;
}
