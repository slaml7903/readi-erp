import {
  airtableCreateRecord,
  airtableFetchAll,
  airtableFetchRecord,
  airtableUpdateRecord,
  type AirtableRecord,
} from "@/lib/airtable/client";
import { AirtableRepositoryError } from "@/lib/airtable/errors/airtable-repository.error";
import { compareLatestFirst } from "@/lib/sort";
import {
  removeUndefinedFields,
  toAirtableLinkedRecordIds,
  toAirtableString,
} from "@/lib/airtable/record";

import { VENDOR_FIELDS, VENDOR_TABLE } from "../config/vendor.config";
import type { CreateVendorInput, Vendor } from "../types/vendor.type";
import { fetchAirtableRecordsByIds } from "./airtable-record-query";

const VENDOR_QUERY_FIELDS = Object.values(VENDOR_FIELDS);

export async function findAllVendors(): Promise<Vendor[]> {
  const records = await airtableFetchAll(VENDOR_TABLE, {
    fields: VENDOR_QUERY_FIELDS,
  });

  return records
    .map(mapVendorRecord)
    .filter((vendor) => vendor.name.length > 0)
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, createdTime: a.createdTime },
        { id: b.id, createdTime: b.createdTime }
      )
    );
}

export async function findVendorById(recordId: string): Promise<Vendor | undefined> {
  try {
    const record = await airtableFetchRecord(VENDOR_TABLE, recordId, {
      cache: "no-store",
      fields: VENDOR_QUERY_FIELDS,
    });

    return mapVendorRecord(record);
  } catch (error) {
    if (error instanceof AirtableRepositoryError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}

export async function findVendorsByIds(recordIds: string[]): Promise<Vendor[]> {
  const records = await fetchAirtableRecordsByIds(
    VENDOR_TABLE,
    recordIds,
    VENDOR_QUERY_FIELDS
  );

  return records.map(mapVendorRecord);
}

export async function insertVendor(input: CreateVendorInput): Promise<Vendor> {
  const record = await airtableCreateRecord(
    VENDOR_TABLE,
    removeUndefinedFields({
      [VENDOR_FIELDS.name]: input.name,
      [VENDOR_FIELDS.manager]: input.manager,
      [VENDOR_FIELDS.email]: input.email,
      [VENDOR_FIELDS.phone]: input.phone,
      [VENDOR_FIELDS.handledItems]: input.handledItems,
      [VENDOR_FIELDS.memo]: input.memo,
    })
  );

  return mapVendorRecord(record);
}

export async function updateVendor(
  recordId: string,
  input: CreateVendorInput
): Promise<Vendor> {
  const record = await airtableUpdateRecord(VENDOR_TABLE, recordId, {
    [VENDOR_FIELDS.name]: input.name,
    [VENDOR_FIELDS.manager]: input.manager ?? null,
    [VENDOR_FIELDS.email]: input.email ?? null,
    [VENDOR_FIELDS.phone]: input.phone ?? null,
    [VENDOR_FIELDS.handledItems]: input.handledItems ?? null,
    [VENDOR_FIELDS.memo]: input.memo ?? null,
  });

  return mapVendorRecord(record);
}

function mapVendorRecord(record: AirtableRecord): Vendor {
  const fields = record.fields;
  const documentRecordIds = toAirtableLinkedRecordIds(
    fields[VENDOR_FIELDS.documents]
  );
  const orderItemRecordIds = toAirtableLinkedRecordIds(
    fields[VENDOR_FIELDS.orderItems]
  );

  return {
    id: record.id,
    createdTime: record.createdTime,
    name: toAirtableString(fields[VENDOR_FIELDS.name]),
    manager: toOptionalString(fields[VENDOR_FIELDS.manager]),
    email: toOptionalString(fields[VENDOR_FIELDS.email]),
    phone: toOptionalString(fields[VENDOR_FIELDS.phone]),
    handledItems: toOptionalString(fields[VENDOR_FIELDS.handledItems]),
    memo: toOptionalString(fields[VENDOR_FIELDS.memo]),
    documentRecordIds,
    orderItemRecordIds,
  };
}

function toOptionalString(value: unknown) {
  return toAirtableString(value) || undefined;
}
