import "server-only";

import { isOutboundMovementType } from "../constants/inventory-movement-type";
import {
  createInventoryMovement,
  getInventoryItemById,
  getInventoryItems,
  getInventoryMovements,
} from "../repository/inventory.repository";
import type { CreateInventoryMovementInput } from "../types/inventory.type";
import {
  InventoryValidationError,
  normalizeInventoryMovementInput,
  validateInventoryMovementInput,
} from "../validation/inventory-movement.validation";

export { InventoryValidationError };

export async function fetchInventoryItems(options: { fresh?: boolean } = {}) {
  return await getInventoryItems(options);
}

export async function fetchInventoryMovements(
  options: { fresh?: boolean } = {}
) {
  const [movements, items] = await Promise.all([
    getInventoryMovements(options),
    getInventoryItems(options),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));

  return movements.map((movement) => {
    const item = movement.itemId ? itemById.get(movement.itemId) : undefined;
    if (!item) return movement;

    return {
      ...movement,
      itemCode: item.itemCode,
      itemName: item.itemName,
    };
  });
}

export async function submitInventoryMovement(
  rawInput: Partial<CreateInventoryMovementInput>
) {
  const input = normalizeInventoryMovementInput(rawInput);
  validateInventoryMovementInput(input);

  const item = await getInventoryItemById(input.itemId, { fresh: true });
  if (!item) {
    throw new InventoryValidationError("ITEM MASTER에서 품목을 찾을 수 없습니다.");
  }

  if (
    isOutboundMovementType(input.type) &&
    input.quantity > item.currentStock
  ) {
    throw new InventoryValidationError(
      `현재고가 ${item.currentStock.toLocaleString("ko-KR")}개이므로 ${input.quantity.toLocaleString("ko-KR")}개를 출고할 수 없습니다.`
    );
  }

  return await createInventoryMovement(input);
}
