import {
  completeReceivingReview,
  createReceivingRecord,
  getReceivingOrderDetail,
  getReceivingReviewItems,
} from "../repository/receiving.repository";

import type { SubmitPurchaseReceivingInput } from "../types/purchase.type";

export class PurchaseReceivingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseReceivingValidationError";
  }
}

export async function fetchReceivingOrderDetail(orderRecordId: string) {
  if (!orderRecordId) {
    throw new PurchaseReceivingValidationError("발주 ID가 필요합니다.");
  }

  return await getReceivingOrderDetail(orderRecordId);
}

export async function fetchReceivingReviewItems() {
  return await getReceivingReviewItems();
}

export async function submitPurchaseReceiving(
  input: SubmitPurchaseReceivingInput
) {
  validateReceivingInput(input);

  return await createReceivingRecord(input);
}

export async function approvePurchaseReceivingReview(receivingRecordId: string) {
  if (!receivingRecordId) {
    throw new PurchaseReceivingValidationError("입고확인 ID가 필요합니다.");
  }

  return await completeReceivingReview(receivingRecordId);
}

function validateReceivingInput(input: SubmitPurchaseReceivingInput) {
  if (!input.orderRecordId) {
    throw new PurchaseReceivingValidationError("발주 ID가 필요합니다.");
  }

  if (!input.receivingChecker.trim()) {
    throw new PurchaseReceivingValidationError("입고확인자를 입력해주세요.");
  }

  if (!input.receivingDate) {
    throw new PurchaseReceivingValidationError("입고확인일을 입력해주세요.");
  }

  if (!input.transactionStatementFile) {
    throw new PurchaseReceivingValidationError("거래명세서를 첨부해주세요.");
  }

  if (!input.receivingEvidenceFile) {
    throw new PurchaseReceivingValidationError("입고증빙을 첨부해주세요.");
  }
}
