import {
  createReceivingRecord,
  getPurchaseOrderStatus,
  getPurchaseOrderReceivingSafetyContext,
  getReceivingsByOrderId,
  getReceivingOrderDetail,
  getReceivingReviewApprovalContext,
  getReceivingReviewItems,
  markOrderReceivingCompleted,
  markReceivingReviewCompleted,
} from "../repository/receiving.repository";
import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_RECEIVING_REVIEW_STATUS,
} from "../constants/purchase-status";
import {
  assertPurchaseOrderStatusTransition,
  assertPurchaseReceivingReviewStatusTransition,
} from "../domain/purchase-status-transition";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import { assertAirtableRecordId } from "../validation/purchase-linked-record.validation";
import {
  validateReceivingInput,
  validateReceivingOrderId,
  validateReceivingReviewId,
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

export async function submitPurchaseReceiving(
  input: SubmitPurchaseReceivingInput
) {
  validateReceivingInput(input);
  assertAirtableRecordId(input.orderRecordId, "발주 ID");
  await assertReceivingCanBeSubmitted(input);

  return await createReceivingRecord(input);
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

  if (!receivingContext.orderRecordId) {
    throw new PurchaseValidationError("연결된 발주가 없는 입고확인입니다.");
  }

  const currentOrderStatus = await getPurchaseOrderStatus(
    receivingContext.orderRecordId
  );

  if (!currentOrderStatus) {
    throw new PurchaseValidationError("연결된 발주 정보를 찾을 수 없습니다.");
  }

  assertPurchaseOrderStatusTransition(
    currentOrderStatus,
    PURCHASE_ORDER_STATUS.RECEIVED
  );

  const reviewedReceivingRecord =
    await markReceivingReviewCompleted(receivingRecordId);
  const completedOrderRecord = await markOrderReceivingCompleted(
    receivingContext.orderRecordId
  );

  return {
    receiving: reviewedReceivingRecord,
    order: completedOrderRecord,
  };
}

async function assertReceivingCanBeSubmitted(
  input: SubmitPurchaseReceivingInput
) {
  const orderContext = await getPurchaseOrderReceivingSafetyContext(
    input.orderRecordId
  );

  if (!orderContext) {
    throw new PurchaseValidationError("연결된 발주 정보를 찾을 수 없습니다.");
  }

  const existingReceivings = await getReceivingsByOrderId(input.orderRecordId);
  const linkedReceivings = existingReceivings.filter((receiving) =>
    receiving.orderRecordIds?.includes(input.orderRecordId)
  );

  if (!orderContext.status) {
    throw new PurchaseValidationError("발주 상태를 확인할 수 없습니다.");
  }

  if (orderContext.status === PURCHASE_ORDER_STATUS.CANCELLED) {
    throw new PurchaseValidationError("취소된 발주는 입고확인을 제출할 수 없습니다.");
  }

  if (orderContext.status === PURCHASE_ORDER_STATUS.RECEIVED) {
    throw new PurchaseValidationError(
      "해당 발주에 대한 입고 처리가 이미 완료되었습니다."
    );
  }

  if (orderContext.items.length === 0) {
    throw new PurchaseValidationError("발주 품목을 확인할 수 없습니다.");
  }

  const hasInvalidOrderQuantity = orderContext.items.some(
    (item) => !item.quantity || item.quantity <= 0
  );

  if (hasInvalidOrderQuantity) {
    throw new PurchaseValidationError("발주 품목 수량을 확인해주세요.");
  }

  const hasCompletedReceiving = linkedReceivings.some(
    (receiving) => receiving.reviewCompleted
  );

  if (hasCompletedReceiving) {
    throw new PurchaseValidationError(
      "해당 발주에 대한 입고 처리가 이미 완료되었습니다."
    );
  }

  const hasDuplicateReceiving = linkedReceivings.some(
    (receiving) =>
      receiving.receivingDate === input.receivingDate &&
      receiving.receivingChecker === input.receivingChecker.trim()
  );

  if (hasDuplicateReceiving) {
    throw new PurchaseValidationError("이미 등록된 입고확인입니다.");
  }
}
