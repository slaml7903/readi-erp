import {
  airtableCreateRecord,
  airtableDeleteRecord,
  airtableUploadAttachment,
  type AirtableRecord,
  type AirtableUploadFileInput,
} from "@/lib/airtable/client";
import {
  toAirtableAttachments,
  toAirtableLinkedRecordIds,
  toAirtableString,
} from "@/lib/airtable/record";

import { DOCUMENT_FIELDS, DOCUMENT_TABLE } from "../config/vendor.config";
import type { VendorDocument, VendorDocumentType } from "../types/vendor.type";
import { fetchAirtableRecordsByIds } from "./airtable-record-query";

const DOCUMENT_QUERY_FIELDS = Object.values(DOCUMENT_FIELDS);

export async function findDocumentsByIds(recordIds: string[]) {
  const records = await fetchAirtableRecordsByIds(
    DOCUMENT_TABLE,
    recordIds,
    DOCUMENT_QUERY_FIELDS
  );

  return records.map(mapDocumentRecord);
}

export async function insertDocumentLink(
  vendorRecordId: string,
  documentType: VendorDocumentType
) {
  return airtableCreateRecord(DOCUMENT_TABLE, {
    [DOCUMENT_FIELDS.vendor]: [vendorRecordId],
    [DOCUMENT_FIELDS.type]: documentType,
  });
}

export async function uploadDocumentAttachment(
  documentRecordId: string,
  file: AirtableUploadFileInput
) {
  return airtableUploadAttachment(
    documentRecordId,
    DOCUMENT_FIELDS.attachment,
    file,
    { revalidateTags: [`airtable-${DOCUMENT_TABLE}`] }
  );
}

export async function removeDocument(documentRecordId: string) {
  return airtableDeleteRecord(DOCUMENT_TABLE, documentRecordId);
}

export function mapDocumentRecord(record: AirtableRecord): VendorDocument {
  const fields = record.fields;

  return {
    id: record.id,
    vendorRecordIds: toAirtableLinkedRecordIds(fields[DOCUMENT_FIELDS.vendor]),
    type: toAirtableString(fields[DOCUMENT_FIELDS.type]),
    attachments:
      toAirtableAttachments(fields[DOCUMENT_FIELDS.attachment], (attachment) => ({
        id: attachment.id,
        url: attachment.url,
        filename: attachment.filename,
        size: attachment.size,
        contentType: attachment.type,
      })) ?? [],
    registeredAt: record.createdTime,
  };
}
