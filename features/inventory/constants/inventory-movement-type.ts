import type { InventoryMovementType } from "../types/inventory.type";

export const INVENTORY_INBOUND_TYPES = [
  "생산입고",
  "기타입고",
  "조정입고",
] as const satisfies readonly InventoryMovementType[];

export const INVENTORY_OUTBOUND_TYPES = [
  "생산사용",
  "기타출고",
  "정비사용",
  "장착사용",
  "반품출고",
  "폐기",
  "조정출고",
] as const satisfies readonly InventoryMovementType[];

export const INVENTORY_MOVEMENT_TYPES = [
  ...INVENTORY_INBOUND_TYPES,
  ...INVENTORY_OUTBOUND_TYPES,
] as const satisfies readonly InventoryMovementType[];

export const INVENTORY_CACHE_TAGS = {
  items: "inventory-items",
  movements: "inventory-movements",
} as const;

export function isInventoryMovementType(
  value: unknown
): value is InventoryMovementType {
  return (
    typeof value === "string" &&
    (INVENTORY_MOVEMENT_TYPES as readonly string[]).includes(value)
  );
}

export function isOutboundMovementType(
  value: InventoryMovementType
): boolean {
  return (INVENTORY_OUTBOUND_TYPES as readonly string[]).includes(value);
}

