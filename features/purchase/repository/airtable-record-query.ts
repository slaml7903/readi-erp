import { airtableFetchAll } from "@/lib/airtable/client";

import { AIRTABLE_RECORD_QUERY_BATCH_SIZE } from "../config/vendor.config";

export async function fetchAirtableRecordsByIds(
  tableName: string,
  recordIds: string[],
  fields: string[]
) {
  if (recordIds.length === 0) return [];

  return (
    await Promise.all(
      chunk(recordIds, AIRTABLE_RECORD_QUERY_BATCH_SIZE).map((recordIdBatch) =>
        airtableFetchAll(tableName, {
          cache: "no-store",
          fields,
          filterByFormula: createRecordIdFilter(recordIdBatch),
        })
      )
    )
  ).flat();
}

function createRecordIdFilter(recordIds: string[]) {
  const comparisons = recordIds.map(
    (recordId) => `RECORD_ID()='${recordId}'`
  );

  return comparisons.length === 1 ? comparisons[0] : `OR(${comparisons.join(",")})`;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
