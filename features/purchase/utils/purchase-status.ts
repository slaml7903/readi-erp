import {
  PURCHASE_ORDER_STATUS_OPTIONS,
  PURCHASE_REQUEST_STATUS_OPTIONS,
  type PurchaseOrderStatus,
  type PurchaseRequestStatus,
} from "../constants/purchase-status";

function normalizeStatusValue(value: unknown) {
  if (typeof value !== "string") return undefined;

  const status = value.trim();
  return status.length > 0 ? status : undefined;
}

function warnUnknownStatus(scope: string, status: string) {
  console.warn(`[purchase-status] unknown ${scope} status: ${status}`);
}

function normalizeKnownStatus<T extends string>(
  value: unknown,
  statuses: readonly T[],
  scope: string
) {
  const status = normalizeStatusValue(value);

  if (!status) return undefined;

  if (statuses.includes(status as T)) {
    return status as T;
  }

  warnUnknownStatus(scope, status);
  return undefined;
}

export function normalizePurchaseRequestStatus(
  value: unknown
): PurchaseRequestStatus | undefined {
  return normalizeKnownStatus(
    value,
    PURCHASE_REQUEST_STATUS_OPTIONS,
    "purchase request"
  );
}

export function normalizePurchaseOrderStatus(
  value: unknown
): PurchaseOrderStatus | undefined {
  return normalizeKnownStatus(value, PURCHASE_ORDER_STATUS_OPTIONS, "order");
}
