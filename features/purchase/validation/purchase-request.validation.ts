import type { CreatePurchaseRequestInput } from "../types/purchase.type";
import {
  normalizeCreatePurchaseOrderInput,
  validateCreatePurchaseOrderInput,
} from "./purchase-order.validation";
import {
  assertNonEmptyArray,
  assertRequiredString,
} from "./purchase-validation.helpers";

export function validatePurchaseRequestInput(input: CreatePurchaseRequestInput) {
  assertRequiredString(input.title, "제목은 필수입니다.");
  assertRequiredString(input.teamName, "팀명은 필수입니다.");
  assertRequiredString(input.requester, "요청자는 필수입니다.");
  assertRequiredString(input.requestDate, "요청일은 필수입니다.");
  assertNonEmptyArray(input.orders, "발주는 최소 1개 이상 필요합니다.");

  input.orders.forEach(validateCreatePurchaseOrderInput);
}

export function normalizePurchaseRequestInput(
  input: CreatePurchaseRequestInput
): CreatePurchaseRequestInput {
  return {
    ...input,
    title: input.title.trim(),
    teamName: input.teamName.trim(),
    requester: input.requester.trim(),
    requestDate: input.requestDate?.trim(),
    requiredDate: input.requiredDate?.trim() || undefined,
    memo: input.memo?.trim() || undefined,
    orders: input.orders.map((order, orderIndex) =>
      normalizeCreatePurchaseOrderInput(
        {
          ...order,
          vendorRecordId: order.vendorRecordId?.trim() || undefined,
          vendorName: order.vendorName?.trim() || undefined,
          orderDate: order.orderDate?.trim(),
          expectedReceivingDate:
            order.expectedReceivingDate?.trim() || undefined,
          receivingChecker: order.receivingChecker?.trim() || undefined,
          memo: order.memo?.trim() || undefined,
        },
        orderIndex
      )
    ),
  };
}
