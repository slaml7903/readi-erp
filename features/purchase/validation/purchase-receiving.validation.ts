import type { SubmitPurchaseReceivingInput } from "../types/purchase.type";
import { assertRequiredString } from "./purchase-validation.helpers";

export function validateReceivingOrderId(orderRecordId: string) {
  assertRequiredString(orderRecordId, "발주 ID가 필요합니다.");
}

export function validateReceivingReviewId(receivingRecordId: string) {
  assertRequiredString(receivingRecordId, "입고확인 ID가 필요합니다.");
}

export function validateReceivingInput(input: SubmitPurchaseReceivingInput) {
  validateReceivingOrderId(input.orderRecordId);
  assertRequiredString(input.receivingChecker, "입고확인자를 입력해주세요.");
  assertRequiredString(input.receivingDate, "입고확인일을 입력해주세요.");

  if (!input.transactionStatementFile) {
    assertRequiredString("", "거래명세서를 첨부해주세요.");
  }

  if (!input.receivingEvidenceFile) {
    assertRequiredString("", "입고증빙을 첨부해주세요.");
  }
}
