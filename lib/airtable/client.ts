type AirtableFetchOptions = {
  pageSize?: number;
  cache?: RequestCache;
  baseId?: string;
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

export type AirtableUploadFileInput = {
  filename: string;
  contentType: string;
  file: string;
};

type AirtableMutationOptions = {
  baseId?: string;
  typecast?: boolean;
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

async function requestAirtable<T>(
  url: URL,
  init: RequestInit,
  errorMessage: string
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
    const message = await response.text();
    throw new Error(`${errorMessage}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export async function airtableFetch(
  tableName: string,
  options: AirtableFetchOptions = {}
): Promise<AirtableResponse> {
  const pageSize = options.pageSize ?? 100;
  const cache = options.cache ?? "force-cache";

  const url = createAirtableUrl(tableName, options.baseId);

  url.searchParams.set("pageSize", String(pageSize));

  return requestAirtable<AirtableResponse>(
    url,
    {
      cache,
      next: {
        revalidate: 30,
        tags: [`airtable-${tableName}`],
      },
    },
    "Failed to fetch Airtable data"
  );
}

export async function airtableFetchRecord(
  tableName: string,
  recordId: string,
  options: Pick<AirtableFetchOptions, "cache"> = {}
): Promise<AirtableRecord> {
  const cache = options.cache ?? "force-cache";
  const url = createAirtableUrl(tableName);

  url.pathname = `${url.pathname}/${encodeURIComponent(recordId)}`;

  return requestAirtable<AirtableRecord>(
    url,
    {
      cache,
      next: {
        revalidate: 30,
        tags: [`airtable-${tableName}`, `airtable-${tableName}-${recordId}`],
      },
    },
    "Failed to fetch Airtable record"
  );
}

async function airtableFetchPage(
  tableName: string,
  offset: string | undefined,
  cache: RequestCache,
  baseId?: string
): Promise<AirtableResponse> {
  const url = createAirtableUrl(tableName, baseId);

  url.searchParams.set("pageSize", "100");

  if (offset) {
    url.searchParams.set("offset", offset);
  }

  return requestAirtable<AirtableResponse>(
    url,
    {
      cache,
      next: {
        revalidate: 30,
        tags: [`airtable-${tableName}`],
      },
    },
    "Failed to fetch Airtable data"
  );
}

export async function airtableFetchAll(
  tableName: string,
  options: AirtableFetchOptions = {}
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const cache = options.cache ?? "force-cache";

  do {
    const data = await airtableFetchPage(tableName, offset, cache, options.baseId);

    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function airtableCreateRecord(
  tableName: string,
  fields: Record<string, unknown>,
  options: AirtableMutationOptions = {}
): Promise<AirtableRecord> {
  const url = createAirtableUrl(tableName, options.baseId);

  if (options.typecast) {
    url.searchParams.set("typecast", "true");
  }

  return requestAirtable<AirtableRecord>(
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
    "Failed to create Airtable record"
  );
}

export async function airtableUpdateRecord(
  tableName: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const url = createAirtableUrl(tableName);

  url.pathname = `${url.pathname}/${encodeURIComponent(recordId)}`;

  return requestAirtable<AirtableRecord>(
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
    "Failed to update Airtable record"
  );
}

export async function airtableCreateRecords(
  tableName: string,
  records: Record<string, unknown>[]
): Promise<AirtableRecord[]> {
  if (records.length === 0) return [];

  const createdRecords: AirtableRecord[] = [];
  const chunks = chunkArray(records, 10);

  for (const chunk of chunks) {
    const url = createAirtableUrl(tableName);

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
      "Failed to create Airtable records"
    );

    createdRecords.push(...data.records);
  }

  return createdRecords;
}

export async function airtableUploadAttachment(
  recordId: string,
  attachmentFieldName: string,
  fileInput: AirtableUploadFileInput
): Promise<AirtableRecord> {
  const baseId = getDefaultAirtableBaseId();
  const url = new URL(
    `https://content.airtable.com/v0/${baseId}/${encodeURIComponent(
      recordId
    )}/${encodeURIComponent(attachmentFieldName)}/uploadAttachment`
  );

  return requestAirtable<AirtableRecord>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileInput),
    },
    "Failed to upload Airtable attachment"
  );
}
