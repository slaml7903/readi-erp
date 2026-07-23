import {
  toAirtableBoolean,
  toAirtableLinkedRecordIds,
  toAirtableNumber,
  toAirtableString,
} from "@/lib/airtable/record";

import {
  ORDER_FIELDS,
  ORDER_ITEM_FIELDS,
  ORDER_ITEM_TABLE,
  ORDER_TABLE,
} from "../config/vendor.config";
import type { VendorPurchaseItem } from "../types/vendor.type";
import { fetchAirtableRecordsByIds } from "./airtable-record-query";

type PurchaseOrderReference = {
  id: string;
  number: string;
  orderDate?: string;
};

export async function findPurchaseItemsForVendor(
  vendorRecordId: string,
  orderItemRecordIds: string[]
): Promise<VendorPurchaseItem[]> {
  if (orderItemRecordIds.length === 0) return [];

  const itemRecords = await fetchAirtableRecordsByIds(
    ORDER_ITEM_TABLE,
    orderItemRecordIds,
    Object.values(ORDER_ITEM_FIELDS)
  );
  const vendorItemRecords = itemRecords.filter((record) =>
    toAirtableLinkedRecordIds(record.fields[ORDER_ITEM_FIELDS.vendor]).includes(
      vendorRecordId
    )
  );
  const orderRecordIds = Array.from(
    new Set(
      vendorItemRecords.flatMap((record) =>
        toAirtableLinkedRecordIds(record.fields[ORDER_ITEM_FIELDS.order])
      )
    )
  );
  const orderRecords = await fetchAirtableRecordsByIds(
    ORDER_TABLE,
    orderRecordIds,
    Object.values(ORDER_FIELDS)
  );
  const orderMap = new Map(
    orderRecords.map((record) => {
      const fields = record.fields;
      const order: PurchaseOrderReference = {
        id: record.id,
        number: toAirtableString(fields[ORDER_FIELDS.number]),
        orderDate:
          toAirtableString(fields[ORDER_FIELDS.orderDate]) ||
          toAirtableString(fields[ORDER_FIELDS.poDate]) ||
          undefined,
      };

      return [record.id, order] as const;
    })
  );

  return vendorItemRecords.map((record) => {
    const fields = record.fields;
    const orderRecordId = toAirtableLinkedRecordIds(
      fields[ORDER_ITEM_FIELDS.order]
    )[0];
    const order = orderRecordId ? orderMap.get(orderRecordId) : undefined;

    return {
      id: record.id,
      name: toAirtableString(fields[ORDER_ITEM_FIELDS.name]),
      quantity: toAirtableNumber(fields[ORDER_ITEM_FIELDS.quantity]),
      unitPrice: toAirtableNumber(fields[ORDER_ITEM_FIELDS.unitPrice]),
      totalAmount: toAirtableNumber(fields[ORDER_ITEM_FIELDS.totalAmount]),
      vatIncluded: toAirtableBoolean(fields[ORDER_ITEM_FIELDS.vatIncluded]) ?? false,
      status: toOptionalString(fields[ORDER_ITEM_FIELDS.status]),
      memo: toOptionalString(fields[ORDER_ITEM_FIELDS.memo]),
      orderRecordId,
      orderNumber: order?.number || undefined,
      orderDate: order?.orderDate,
    };
  });
}

function toOptionalString(value: unknown) {
  return toAirtableString(value) || undefined;
}
