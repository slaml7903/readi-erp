import {
  createReceivingRecord,
  getReceivingOrderDetail,
  getReceivingReviewApprovalContext,
  getReceivingReviewItems,
  getReceivingSelectionData,
  getReceivingSubmissionContext,
  markReceivingReviewCompleted,
} from "../repository/receiving.repository";
import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_RECEIVING_REVIEW_STATUS,
} from "../constants/purchase-status";
import {
  assertPurchaseReceivingReviewStatusTransition,
} from "../domain/purchase-status-transition";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import { assertAirtableRecordId } from "../validation/purchase-linked-record.validation";
import {
  validateReceivingInput,
  validateReceivingOrderId,
  validateReceivingReviewId,
  normalizeReceivingInput,
} from "../validation/purchase-receiving.validation";

import type { SubmitPurchaseReceivingInput } from "../types/purchase.type";

export { PurchaseValidationError as PurchaseReceivingValidationError };

export async function fetchReceivingOrderDetail(orderRecordId: string) {
  validateReceivingOrderId(orderRecordId);
  assertAirtableRecordId(orderRecordId, "발주 ID");

  return await getReceivingOrderDetail(orderRecordId);
}

export async function fetchReceivingReviewItems() {
  return await getReceivingReviewItems();
}

export async function fetchReceivingSelectionData() {
  return await getReceivingSelectionData();
}

const inFlightReceivingItemIds = new Set<string>();

export async function submitPurchaseReceiving(
  rawInput: Partial<SubmitPurchaseReceivingInput> | null | undefined
) {
  const input = normalizeReceivingInput(rawInput);
  validateReceivingInput(input);
  assertAirtableRecordId(input.requestRecordId, "구매요청 ID");
  assertAirtableRecordId(input.orderRecordId, "발주 ID");
  input.orderItemRecordIds.forEach((itemId) =>
    assertAirtableRecordId(itemId, "발주상세품목 ID")
  );

  if (input.orderItemRecordIds.some((itemId) => inFlightReceivingItemIds.has(itemId))) {
    throw new PurchaseValidationError("동일한 품목의 입고확인이 이미 처리 중입니다.");
  }

  input.orderItemRecordIds.forEach((itemId) => inFlightReceivingItemIds.add(itemId));

  try {
    await assertReceivingSelectionIsValid(input);
    return await createReceivingRecord(input);
  } finally {
    input.orderItemRecordIds.forEach((itemId) => inFlightReceivingItemIds.delete(itemId));
  }
}

export async function approvePurchaseReceivingReview(receivingRecordId: string) {
  validateReceivingReviewId(receivingRecordId);
  assertAirtableRecordId(receivingRecordId, "입고확인 ID");

  const receivingContext =
    await getReceivingReviewApprovalContext(receivingRecordId);

  if (!receivingContext) {
    throw new PurchaseValidationError("입고확인 정보를 찾을 수 없습니다.");
  }

  const currentReviewStatus = receivingContext.reviewCompleted
    ? PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED
    : PURCHASE_RECEIVING_REVIEW_STATUS.PENDING;

  if (currentReviewStatus === PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED) {
    throw new PurchaseValidationError("이미 검토완료된 입고확인입니다.");
  }

  assertPurchaseReceivingReviewStatusTransition(
    currentReviewStatus,
    PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED
  );

  return await markReceivingReviewCompleted(receivingRecordId);
}

async function assertReceivingSelectionIsValid(input: SubmitPurchaseReceivingInput) {
  const context = await getReceivingSubmissionContext(
    input.requestRecordId,
    input.orderRecordId,
    input.orderItemRecordIds
  );

  if (!context.request) {
    throw new PurchaseValidationError("선택한 구매요청을 찾을 수 없습니다.");
  }
  if (!context.order) {
    throw new PurchaseValidationError("선택한 발주를 찾을 수 없습니다.");
  }
  if (
    !context.request.orderRecordIds.includes(input.orderRecordId) ||
    !context.order.requestRecordIds.includes(input.requestRecordId)
  ) {
    throw new PurchaseValidationError("선택한 발주가 해당 구매요청에 연결되어 있지 않습니다.");
  }
  if (context.order.status === PURCHASE_ORDER_STATUS.CANCELLED) {
    throw new PurchaseValidationError("취소된 발주는 입고확인을 등록할 수 없습니다.");
  }
  if (context.order.status === PURCHASE_ORDER_STATUS.RECEIVED) {
    throw new PurchaseValidationError("입고완료된 발주는 신규 입고 대상이 아닙니다.");
  }
  if (context.items.length !== input.orderItemRecordIds.length) {
    throw new PurchaseValidationError("선택한 발주상세품목 중 존재하지 않는 항목이 있습니다.");
  }

  for (const item of context.items) {
    if (
      !context.order.orderItemRecordIds.includes(item.id) ||
      !item.orderRecordIds.includes(input.orderRecordId)
    ) {
      throw new PurchaseValidationError(
        `'${item.itemName}' 품목이 선택한 발주에 연결되어 있지 않습니다.`
      );
    }
    if (item.status !== "미입고") {
      throw new PurchaseValidationError(
        `'${item.itemName}' 품목은 현재 '${item.status}' 상태이므로 입고할 수 없습니다.`
      );
    }
    if (item.refundOrCancelled) {
      throw new PurchaseValidationError(`'${item.itemName}' 품목은 환불/취소 대상입니다.`);
    }
    if (item.receivingRecordIds.length > 0) {
      throw new PurchaseValidationError(
        `'${item.itemName}' 품목은 이미 입고확인에 연결되어 있습니다.`
      );
    }
  }
}
