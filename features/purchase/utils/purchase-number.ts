import { PurchaseValidationError } from "../errors/purchase-validation.error";

type NormalizePurchaseNumberOptions = {
  allowZero?: boolean;
  allowNegative?: boolean;
  fieldName?: string;
};

export function normalizePurchaseNumber(
  value: unknown,
  options: NormalizePurchaseNumberOptions = {}
) {
  const fieldName = options.fieldName ?? "숫자";
  let normalizedValue: number;

  if (typeof value === "number") {
    normalizedValue = value;
  } else if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new PurchaseValidationError(`${fieldName} 값을 입력해주세요.`);
    }

    normalizedValue = Number(trimmedValue.replaceAll(",", ""));
  } else {
    throw new PurchaseValidationError(`${fieldName} 값을 입력해주세요.`);
  }

  if (!Number.isFinite(normalizedValue)) {
    throw new PurchaseValidationError(`${fieldName} 값을 확인해주세요.`);
  }

  if (!options.allowNegative && normalizedValue < 0) {
    throw new PurchaseValidationError(`${fieldName} 값은 음수일 수 없습니다.`);
  }

  if (!options.allowZero && normalizedValue === 0) {
    throw new PurchaseValidationError(`${fieldName} 값은 0보다 커야 합니다.`);
  }

  return normalizedValue;
}
