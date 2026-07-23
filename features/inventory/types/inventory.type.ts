export type InventoryStockStatus =
  | "정상"
  | "발주필요"
  | "품절"
  | "재고오류"
  | "기준미설정";

export type InventoryItem = {
  id: string;
  createdTime?: string;
  itemCode: string;
  itemName: string;
  specification?: string;
  vendor?: string;
  department?: string;
  standardUnitPrice?: number;
  currentStock: number;
  safetyStock?: number;
  status: InventoryStockStatus;
  purchaseReceivedQuantity: number;
  movementQuantity: number;
  imageUrl?: string;
};

export type InventoryMovementType =
  | "생산입고"
  | "기타입고"
  | "조정입고"
  | "생산사용"
  | "기타출고"
  | "정비사용"
  | "장착사용"
  | "반품출고"
  | "폐기"
  | "조정출고";

export type InventoryMovement = {
  id: string;
  createdTime?: string;
  stockNumber?: string;
  transactionDate: string;
  type: InventoryMovementType;
  itemId?: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  signedQuantity: number;
};

export type CreateInventoryMovementInput = {
  transactionDate: string;
  type: InventoryMovementType;
  itemId: string;
  quantity: number;
};
