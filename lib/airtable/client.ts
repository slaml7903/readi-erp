const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!token) {
  throw new Error("AIRTABLE_PERSONAL_ACCESS_TOKEN is not defined");
}

if (!baseId) {
  throw new Error("AIRTABLE_BASE_ID is not defined");
}

type AirtableFetchOptions = {
  pageSize?: number;
  cache?: RequestCache;
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

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function airtableFetch(
  tableName: string,
  options: AirtableFetchOptions = {}
): Promise<AirtableResponse> {
  const pageSize = options.pageSize ?? 100;
  const cache = options.cache ?? "force-cache";

  const url = new URL(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
  );

  url.searchParams.set("pageSize", String(pageSize));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache,
    next: {
      revalidate: 30,
      tags: [`airtable-${tableName}`],
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fetch Airtable data: ${message}`);
  }

  return response.json();
}

export async function airtableFetchAll(
  tableName: string,
  options: AirtableFetchOptions = {}
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const cache = options.cache ?? "force-cache";

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
    );

    url.searchParams.set("pageSize", "100");

    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache,
      next: {
        revalidate: 30,
        tags: [`airtable-${tableName}`],
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to fetch Airtable data: ${message}`);
    }

    const data = (await response.json()) as AirtableResponse;

    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function airtableCreateRecord(
  tableName: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const url = new URL(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
  );

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Airtable record: ${message}`);
  }

  return response.json();
}

export async function airtableCreateRecords(
  tableName: string,
  records: Record<string, unknown>[]
): Promise<AirtableRecord[]> {
  if (records.length === 0) return [];

  const createdRecords: AirtableRecord[] = [];
  const chunks = chunkArray(records, 10);

  for (const chunk of chunks) {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
    );

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: chunk.map((fields) => ({
          fields,
        })),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to create Airtable records: ${message}`);
    }

    const data = (await response.json()) as AirtableCreateRecordsResponse;

    createdRecords.push(...data.records);
  }

  return createdRecords;
}