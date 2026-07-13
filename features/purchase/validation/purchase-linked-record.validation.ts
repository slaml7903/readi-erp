import { PurchaseValidationError } from "../errors/purchase-validation.error";

const AIRTABLE_RECORD_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;

export function assertAirtableRecordId(value: string, fieldName: string) {
  if (!AIRTABLE_RECORD_ID_PATTERN.test(value)) {
    throw new PurchaseValidationError(`${fieldName} 형식이 올바르지 않습니다.`);
  }
}
