import {
  isInventoryMovementType,
} from "../constants/inventory-movement-type";
import type { CreateInventoryMovementInput } from "../types/inventory.type";

export class InventoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryValidationError";
  }
}

const AIRTABLE_RECORD_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeInventoryMovementInput(
  input: Partial<CreateInventoryMovementInput>
): CreateInventoryMovementInput {
  const rawQuantity: unknown = input.quantity;

  return {
    transactionDate:
      typeof input.transactionDate === "string"
        ? input.transactionDate.trim()
        : "",
    type: input.type as CreateInventoryMovementInput["type"],
    itemId: typeof input.itemId === "string" ? input.itemId.trim() : "",
    quantity: Number(rawQuantity),
  };
}

export function validateInventoryMovementInput(
  input: CreateInventoryMovementInput
) {
  if (!AIRTABLE_RECORD_ID_PATTERN.test(input.itemId)) {
    throw new InventoryValidationError("유효한 품목을 선택해 주세요.");
  }

  if (!isInventoryMovementType(input.type)) {
    throw new InventoryValidationError("허용되지 않은 재고변동 유형입니다.");
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new InventoryValidationError("수량은 0보다 큰 정수여야 합니다.");
  }

  if (!isValidDateOnly(input.transactionDate)) {
    throw new InventoryValidationError("거래일자는 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.");
  }
}
