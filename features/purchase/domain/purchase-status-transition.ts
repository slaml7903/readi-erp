import { PurchaseValidationError } from "../errors/purchase-validation.error";
import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_RECEIVING_REVIEW_STATUS,
  type PurchaseOrderStatus,
  type PurchaseReceivingReviewStatus,
} from "../constants/purchase-status";

const PURCHASE_ORDER_TRANSITIONS: Record<
  PurchaseOrderStatus,
  PurchaseOrderStatus[]
> = {
  [PURCHASE_ORDER_STATUS.BEFORE_ORDER]: [],
  [PURCHASE_ORDER_STATUS.PRE_PURCHASE]: [],
  [PURCHASE_ORDER_STATUS.ORDERED]: [
    PURCHASE_ORDER_STATUS.SHIPPING,
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.SHIPPING]: [
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.HOLD]: [],
  [PURCHASE_ORDER_STATUS.RECEIVED]: [],
  [PURCHASE_ORDER_STATUS.CANCELLED]: [],
};

const PURCHASE_RECEIVING_REVIEW_TRANSITIONS: Record<
  PurchaseReceivingReviewStatus,
  PurchaseReceivingReviewStatus[]
> = {
  [PURCHASE_RECEIVING_REVIEW_STATUS.PENDING]: [
    PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED,
  ],
  [PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED]: [],
};

function canTransition<T extends string>(
  transitions: Record<T, T[]>,
  from: T,
  to: T
) {
  return transitions[from]?.includes(to) ?? false;
}

function assertTransition<T extends string>(
  transitions: Record<T, T[]>,
  from: T,
  to: T,
  message: string
) {
  if (!canTransition(transitions, from, to)) {
    throw new PurchaseValidationError(message);
  }
}

export function assertPurchaseOrderStatusTransition(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus
) {
  assertTransition(
    PURCHASE_ORDER_TRANSITIONS,
    from,
    to,
    `발주 상태를 ${from}에서 ${to}(으)로 변경할 수 없습니다.`
  );
}

export function assertPurchaseReceivingReviewStatusTransition(
  from: PurchaseReceivingReviewStatus,
  to: PurchaseReceivingReviewStatus
) {
  assertTransition(
    PURCHASE_RECEIVING_REVIEW_TRANSITIONS,
    from,
    to,
    `입고검토 상태를 ${from}에서 ${to}(으)로 변경할 수 없습니다.`
  );
}
