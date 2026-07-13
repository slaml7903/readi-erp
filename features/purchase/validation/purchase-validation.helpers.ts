import { PurchaseValidationError } from "../errors/purchase-validation.error";

export function assertRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PurchaseValidationError(message);
  }
}

export function assertNonEmptyArray<T>(
  value: T[] | undefined,
  message: string
) {
  if (!value || value.length === 0) {
    throw new PurchaseValidationError(message);
  }
}

export function assertPositiveNumber(value: number, message: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new PurchaseValidationError(message);
  }
}

export function assertNonNegativeNumber(value: number, message: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new PurchaseValidationError(message);
  }
}
