import {
  airtableCreateRecord,
  airtableFetchAll,
  airtableFetchRecord,
  airtableUpdateRecord,
  airtableUploadAttachment,
  type AirtableRecord,
  type AirtableUploadFileInput,
} from "@/lib/airtable/client";
import { AirtableRepositoryError } from "@/lib/airtable/errors/airtable-repository.error";

import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_RECEIVING_REVIEW_STATUS,
} from "../constants/purchase-status";
import { normalizePurchaseOrderStatus } from "../utils/purchase-status";
import type {
  AirtableAttachment,
  PurchaseOrderItemSummary,
  PurchaseOrderStatus,
  PurchaseReceivingReviewStatus,
  PurchaseReceivingOrderDetail,
  PurchaseReceivingReviewItem,
  SubmitPurchaseReceivingInput,
} from "../types/purchase.type";

const ORDER_TABLE = "02.Order";
const ORDER_ITEM_TABLE = "03.O-Items";
const RECEIVING_TABLE = "02-1.RCV";
const VENDOR_TABLE = "05.Vendor";

type AirtableAttachmentRaw = {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
};

function toString(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  return String(value);
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const values = value.map((item) => String(item)).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toAttachments(value: unknown): AirtableAttachment[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const files = value
    .map((item) => item as Partial<AirtableAttachmentRaw>)
    .filter((item) => item.id && item.url && item.filename)
    .map((item) => ({
      id: String(item.id),
      url: String(item.url),
      filename: String(item.filename),
      size: item.size,
      type: item.type,
    }));

  return files.length > 0 ? files : undefined;
}

function removeUndefinedFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}

function escapeAirtableFormulaString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function isAirtableNotFoundError(error: unknown) {
  return error instanceof AirtableRepositoryError && error.status === 404;
}

function createVendorNameMap(records: AirtableRecord[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    const vendorName = toString(record.fields["공급업체명"]);

    if (vendorName) {
      map.set(record.id, vendorName);
    }
  });

  return map;
}

function createOrderNoMap(records: AirtableRecord[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    const poNo = toString(record.fields["발주번호"]);

    if (poNo) {
      map.set(record.id, poNo);
    }
  });

  return map;
}

function mapOrderItem(record: AirtableRecord): PurchaseOrderItemSummary {
  const fields = record.fields;

  return {
    id: record.id,
    modelName: toString(fields["발주상세(모델명)"]),
    quantity: toNumber(fields["수량"]),
    unitPrice: toNumber(fields["단가"]),
    amount: toNumber(fields["총액"]),
    vatIncluded: toBoolean(fields["vat포함"]),
    memo: toString(fields["비고"]) || undefined,
  };
}

function mapReceivingReviewItem(
  record: AirtableRecord,
  orderNoMap: Map<string, string>
): PurchaseReceivingReviewItem {
  const fields = record.fields;
  const poRecordIds = toStringArray(fields["PO NO."]);

  return {
    id: record.id,
    receivingNo: toString(fields["입고확인"]),
    poRecordIds,
    poNos: poRecordIds
      ?.map((poRecordId) => orderNoMap.get(poRecordId))
      .filter((poNo): poNo is string => Boolean(poNo)),
    title: toString(fields["제목"]) || undefined,
    receivingChecker: toString(fields["입고확인자"]) || undefined,
    receivingDate: toString(fields["입고확인일"]) || undefined,
    transactionStatementFiles: toAttachments(fields["거래명세서"]),
    receivingEvidenceFiles: toAttachments(fields["입고증빙"]),
    reviewCompleted: toBoolean(fields["검토완료"]),
    memo: toString(fields["비고"]) || undefined,
  };
}

export async function getReceivingOrderDetail(
  orderRecordId: string
): Promise<PurchaseReceivingOrderDetail> {
  const [orderRecord, orderItemRecords, vendorRecords] = await Promise.all([
    airtableFetchRecord(ORDER_TABLE, orderRecordId, { cache: "no-store" }),
    airtableFetchAll(ORDER_ITEM_TABLE, { cache: "no-store" }),
    airtableFetchAll(VENDOR_TABLE),
  ]);

  const vendorNameMap = createVendorNameMap(vendorRecords);
  const orderFields = orderRecord.fields;
  const vendorRecordIds = toStringArray(orderFields["벤더"]);
  const poItems = orderItemRecords
    .filter((record) => toStringArray(record.fields["PO NO."])?.includes(orderRecordId))
    .map(mapOrderItem);

  return {
    id: orderRecord.id,
    poNo: toString(orderFields["발주번호"]),
    title: toString(orderFields["제목"]) || undefined,
    status: normalizePurchaseOrderStatus(orderFields["상태"]),
    expectedReceivingDate: toString(orderFields["예상 입고일"]) || undefined,
    receivingChecker: toString(orderFields["입고확인자"]) || undefined,
    vendorNames: vendorRecordIds
      ?.map((vendorRecordId) => vendorNameMap.get(vendorRecordId))
      .filter((vendorName): vendorName is string => Boolean(vendorName)),
    items: poItems,
  };
}

export type PurchaseOrderReceivingSafetyContext = {
  id: string;
  poNo: string;
  status?: PurchaseOrderStatus;
  items: PurchaseOrderItemSummary[];
};

export async function getPurchaseOrderReceivingSafetyContext(
  orderRecordId: string
): Promise<PurchaseOrderReceivingSafetyContext | undefined> {
  let orderRecord: AirtableRecord;

  try {
    orderRecord = await airtableFetchRecord(ORDER_TABLE, orderRecordId, {
      cache: "no-store",
      fields: ["발주번호", "상태"],
    });
  } catch (error) {
    if (isAirtableNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
  const poNo = toString(orderRecord.fields["발주번호"]);
  const orderItemRecords = poNo
    ? await airtableFetchAll(ORDER_ITEM_TABLE, {
      cache: "no-store",
      fields: [
        "PO NO.",
        "발주상세(모델명)",
        "수량",
        "단가",
        "총액",
        "vat포함",
        "비고",
      ],
      filterByFormula: `FIND("${escapeAirtableFormulaString(
        poNo
      )}", ARRAYJOIN({PO NO.})) > 0`,
    })
    : [];

  return {
    id: orderRecord.id,
    poNo,
    status: normalizePurchaseOrderStatus(orderRecord.fields["상태"]),
    items: orderItemRecords.map(mapOrderItem),
  };
}

export async function getReceivingReviewItems(): Promise<
  PurchaseReceivingReviewItem[]
> {
  const [receivingRecords, orderRecords] = await Promise.all([
    airtableFetchAll(RECEIVING_TABLE, { cache: "no-store" }),
    airtableFetchAll(ORDER_TABLE),
  ]);

  const orderNoMap = createOrderNoMap(orderRecords);

  return receivingRecords
    .map((record) => mapReceivingReviewItem(record, orderNoMap))
    .sort((a, b) => {
      if (a.reviewCompleted !== b.reviewCompleted) {
        return a.reviewCompleted ? 1 : -1;
      }

      return String(b.receivingDate ?? "").localeCompare(
        String(a.receivingDate ?? "")
      );
    });
}

export type ReceivingSafetyContext = {
  id: string;
  receivingNo: string;
  orderRecordIds?: string[];
  receivingChecker?: string;
  receivingDate?: string;
  reviewCompleted: boolean;
  reviewStatus: PurchaseReceivingReviewStatus;
};

export async function getReceivingsByOrderId(
  orderRecordId: string
): Promise<ReceivingSafetyContext[]> {
  const orderRecord = await airtableFetchRecord(ORDER_TABLE, orderRecordId, {
    cache: "no-store",
    fields: ["발주번호"],
  });
  const poNo = toString(orderRecord.fields["발주번호"]);

  if (!poNo) return [];

  const records = await airtableFetchAll(RECEIVING_TABLE, {
    cache: "no-store",
    fields: ["입고확인", "PO NO.", "입고확인자", "입고확인일", "검토완료"],
    filterByFormula: `FIND("${escapeAirtableFormulaString(
      poNo
    )}", ARRAYJOIN({PO NO.})) > 0`,
  });

  return records.map((record) => {
    const reviewCompleted = toBoolean(record.fields["검토완료"]);

    return {
      id: record.id,
      receivingNo: toString(record.fields["입고확인"]),
      orderRecordIds: toStringArray(record.fields["PO NO."]),
      receivingChecker: toString(record.fields["입고확인자"]) || undefined,
      receivingDate: toString(record.fields["입고확인일"]) || undefined,
      reviewCompleted,
      reviewStatus: reviewCompleted
        ? PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED
        : PURCHASE_RECEIVING_REVIEW_STATUS.PENDING,
    };
  });
}

export async function createReceivingRecord(
  input: SubmitPurchaseReceivingInput
) {
  const receivingRecord = await airtableCreateRecord(
    RECEIVING_TABLE,
    removeUndefinedFields({
      "PO NO.": [input.orderRecordId],
      입고확인자: input.receivingChecker,
      입고확인일: input.receivingDate,
      검토완료: false,
      비고: input.memo || undefined,
    })
  );

  if (input.transactionStatementFile) {
    await uploadReceivingAttachment(
      receivingRecord.id,
      "거래명세서",
      input.transactionStatementFile
    );
  }

  if (input.receivingEvidenceFile) {
    await uploadReceivingAttachment(
      receivingRecord.id,
      "입고증빙",
      input.receivingEvidenceFile
    );
  }

  return await airtableFetchRecord(RECEIVING_TABLE, receivingRecord.id, {
    cache: "no-store",
  });
}

async function uploadReceivingAttachment(
  receivingRecordId: string,
  fieldName: string,
  file: AirtableUploadFileInput
) {
  return await airtableUploadAttachment(receivingRecordId, fieldName, file);
}

export async function getReceivingReviewApprovalContext(
  receivingRecordId: string
) {
  let receivingRecord: AirtableRecord;

  try {
    receivingRecord = await airtableFetchRecord(
      RECEIVING_TABLE,
      receivingRecordId,
      { cache: "no-store" }
    );
  } catch (error) {
    if (isAirtableNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }

  return {
    reviewCompleted: toBoolean(receivingRecord.fields["검토완료"]),
    orderRecordId: toStringArray(receivingRecord.fields["PO NO."])?.[0],
  };
}

export async function markReceivingReviewCompleted(receivingRecordId: string) {
  return await airtableUpdateRecord(RECEIVING_TABLE, receivingRecordId, {
    검토완료: true,
  });
}

export async function getPurchaseOrderStatus(orderRecordId: string) {
  let orderRecord: AirtableRecord;

  try {
    orderRecord = await airtableFetchRecord(ORDER_TABLE, orderRecordId, {
      cache: "no-store",
      fields: ["상태"],
    });
  } catch (error) {
    if (isAirtableNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }

  return normalizePurchaseOrderStatus(orderRecord.fields["상태"]);
}

export async function markOrderReceivingCompleted(orderRecordId: string) {
  return await airtableUpdateRecord(ORDER_TABLE, orderRecordId, {
    상태: PURCHASE_ORDER_STATUS.RECEIVED,
  });
}
