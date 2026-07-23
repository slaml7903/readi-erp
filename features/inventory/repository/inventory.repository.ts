import "server-only";

import {
  airtableCreateRecord,
  airtableFetchAll,
  airtableFetchRecord,
} from "@/lib/airtable/client";
import {
  toAirtableAttachments,
  toAirtableDateOnly,
  toAirtableFirstString,
  toAirtableLinkedRecordIds,
  toAirtableNumber,
  toAirtableString,
} from "@/lib/airtable/record";
import { compareLatestFirst } from "@/lib/sort";

import {
  INVENTORY_CACHE_TAGS,
  isInventoryMovementType,
} from "../constants/inventory-movement-type";
import type {
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryMovement,
  InventoryStockStatus,
} from "../types/inventory.type";

const ITEM_TABLE = "ITEM MASTER";
const MOVEMENT_TABLE = "생산&창고";

const ITEM_FIELDS = [
  "품목코드(예찬 업뎃예정)",
  "품명",
  "규격/모델/사양",
  "메인거래처",
  "관리부서",
  "표준단가(KRW)",
  "현재고",
  "안전재고",
  "상태",
  "구매입고수량",
  "생산입출고수량",
  "사진",
];

const MOVEMENT_FIELDS = [
  "stock번호",
  "Date",
  "유형",
  "품목코드",
  "품명",
  "수량",
  "증감계산",
];

function getInventoryBaseId() {
  const baseId = process.env.AIRTABLE_INVENTORY_BASE_ID;

  if (!baseId) {
    throw new Error("AIRTABLE_INVENTORY_BASE_ID is not defined");
  }

  return baseId;
}

function deriveStockStatus(
  rawStatus: unknown,
  currentStock: number,
  safetyStock?: number
): InventoryStockStatus {
  if (safetyStock === undefined) return "기준미설정";

  const status = toAirtableFirstString(rawStatus);
  if (["정상", "발주필요", "품절", "재고오류", "기준미설정"].includes(status)) {
    return status as InventoryStockStatus;
  }
  if (currentStock < 0) return "재고오류";
  if (currentStock === 0) return "품절";
  if (safetyStock !== undefined && currentStock <= safetyStock) return "발주필요";
  return "정상";
}

function mapInventoryItem(record: {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}): InventoryItem {
  const fields = record.fields;
  const safetyStockValue = fields["안전재고"];
  const hasSafetyStock =
    safetyStockValue !== undefined &&
    safetyStockValue !== null &&
    !(typeof safetyStockValue === "string" && safetyStockValue.trim() === "") &&
    !(Array.isArray(safetyStockValue) && safetyStockValue.length === 0);
  const safetyStock = hasSafetyStock
    ? toAirtableNumber(safetyStockValue)
    : undefined;
  const currentStock = toAirtableNumber(fields["현재고"]);
  const images = toAirtableAttachments(fields["사진"], (image) => image.url);

  return {
    id: record.id,
    createdTime: record.createdTime,
    itemCode: toAirtableFirstString(fields["품목코드(예찬 업뎃예정)"]),
    itemName: toAirtableFirstString(fields["품명"]),
    specification: toAirtableString(fields["규격/모델/사양"]) || undefined,
    vendor: toAirtableString(fields["메인거래처"]) || undefined,
    department: toAirtableString(fields["관리부서"]) || undefined,
    standardUnitPrice: toAirtableNumber(fields["표준단가(KRW)"]) || undefined,
    currentStock,
    safetyStock,
    status: deriveStockStatus(fields["상태"], currentStock, safetyStock),
    purchaseReceivedQuantity: toAirtableNumber(fields["구매입고수량"]),
    movementQuantity: toAirtableNumber(fields["생산입출고수량"]),
    imageUrl: images?.[0],
  };
}

function mapInventoryMovement(record: {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}): InventoryMovement | undefined {
  const fields = record.fields;
  const type = toAirtableFirstString(fields["유형"]);
  if (!isInventoryMovementType(type)) return undefined;

  const linkedItemIds = toAirtableLinkedRecordIds(fields["품목코드"]);
  const rawQuantity = toAirtableNumber(fields["수량"]);
  const signedQuantity = toAirtableNumber(fields["증감계산"]);

  return {
    id: record.id,
    createdTime: record.createdTime,
    stockNumber: toAirtableFirstString(fields["stock번호"]) || undefined,
    transactionDate: toAirtableDateOnly(fields["Date"]),
    type,
    itemId: linkedItemIds[0],
    itemCode: toAirtableString(fields["품목코드"]),
    itemName: toAirtableString(fields["품명"]),
    quantity: Math.abs(rawQuantity),
    signedQuantity,
  };
}

export async function getInventoryItems(options: { fresh?: boolean } = {}) {
  const records = await airtableFetchAll(ITEM_TABLE, {
    baseId: getInventoryBaseId(),
    fields: ITEM_FIELDS,
    tags: [INVENTORY_CACHE_TAGS.items],
    cache: options.fresh ? "no-store" : undefined,
  });

  return records
    .map(mapInventoryItem)
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, createdTime: a.createdTime },
        { id: b.id, createdTime: b.createdTime }
      )
    );
}

export async function getInventoryItemById(
  itemId: string,
  options: { fresh?: boolean } = {}
) {
  try {
    const record = await airtableFetchRecord(ITEM_TABLE, itemId, {
      baseId: getInventoryBaseId(),
      fields: ITEM_FIELDS,
      tags: [INVENTORY_CACHE_TAGS.items],
      cache: options.fresh ? "no-store" : undefined,
    });
    return mapInventoryItem(record);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function getInventoryMovements(options: { fresh?: boolean } = {}) {
  const records = await airtableFetchAll(MOVEMENT_TABLE, {
    baseId: getInventoryBaseId(),
    fields: MOVEMENT_FIELDS,
    sort: [{ field: "Date", direction: "desc" }],
    tags: [INVENTORY_CACHE_TAGS.movements],
    cache: options.fresh ? "no-store" : undefined,
  });

  return records
    .map(mapInventoryMovement)
    .filter((movement): movement is InventoryMovement => Boolean(movement))
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, date: a.transactionDate, createdTime: a.createdTime },
        { id: b.id, date: b.transactionDate, createdTime: b.createdTime }
      )
    );
}

export async function createInventoryMovement(
  input: CreateInventoryMovementInput
) {
  return await airtableCreateRecord(
    MOVEMENT_TABLE,
    {
      Date: input.transactionDate,
      유형: input.type,
      품목코드: [input.itemId],
      수량: input.quantity,
    },
    {
      baseId: getInventoryBaseId(),
      typecast: true,
      revalidateTags: [
        INVENTORY_CACHE_TAGS.items,
        INVENTORY_CACHE_TAGS.movements,
      ],
    }
  );
}
