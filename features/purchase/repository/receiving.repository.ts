import {
  airtableCreateRecord,
  airtableDeleteRecord,
  airtableFetchAll,
  airtableFetchRecord,
  airtableUpdateRecord,
  airtableUploadAttachment,
  type AirtableRecord,
  type AirtableUploadFileInput,
} from "@/lib/airtable/client";
import { AirtableRepositoryError } from "@/lib/airtable/errors/airtable-repository.error";
import { compareLatestFirst } from "@/lib/sort";
import { PurchaseReceivingUploadError } from "../errors/purchase-receiving-upload.error";

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
  PurchaseReceivingSelectionData,
  PurchaseReceivingItemOption,
  SubmitPurchaseReceivingInput,
} from "../types/purchase.type";

const REQUEST_TABLE = "01.P-RQST";
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

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value !== 0;
  if (Array.isArray(value)) return value.some(hasValue);
  return true;
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
    createdTime: record.createdTime,
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

function mapReceivingItemOption(
  record: AirtableRecord,
  receivingIdsByItemId: Map<string, Set<string>>
): PurchaseReceivingItemOption {
  const fields = record.fields;
  const status = toString(fields["상태"]).trim();
  const linkedReceivingIds = new Set([
    ...(toStringArray(fields["입고확인"]) ?? []),
    ...(receivingIdsByItemId.get(record.id) ?? []),
  ]);
  const refundOrCancelled = hasValue(fields["환불/취소"]);

  let unavailableReason: string | undefined;
  if (status !== "미입고") {
    unavailableReason = status === "입고완료"
      ? "이미 입고완료된 품목입니다."
      : status === "입고확인중"
        ? "입고확인 검토 중인 품목입니다."
        : "미입고 상태의 품목만 선택할 수 있습니다.";
  } else if (refundOrCancelled) {
    unavailableReason = "환불/취소된 품목입니다.";
  } else if (linkedReceivingIds.size > 0) {
    unavailableReason = "이미 입고확인에 연결된 품목입니다.";
  }

  return {
    id: record.id,
    orderRecordIds: toStringArray(fields["PO NO."]) ?? [],
    itemName:
      toString(fields["품명"]) ||
      toString(fields["발주상세(모델명)"]) ||
      "품명 없음",
    itemMaster:
      toString(fields["품목코드"]) ||
      toString(fields["Item master"]) ||
      "-",
    specification:
      toString(fields["규격"]) ||
      toString(fields["규격/모델/사양"]) ||
      undefined,
    quantity: toNumber(fields["수량"]) || undefined,
    status: status || "상태미확인",
    refundOrCancelled,
    receivingRecordIds: [...linkedReceivingIds],
    selectable: !unavailableReason,
    unavailableReason,
  };
}

function createReceivingIdsByItemId(records: AirtableRecord[]) {
  const map = new Map<string, Set<string>>();

  records.forEach((record) => {
    (toStringArray(record.fields["발주상세품목"]) ?? []).forEach((itemId) => {
      const receivingIds = map.get(itemId) ?? new Set<string>();
      receivingIds.add(record.id);
      map.set(itemId, receivingIds);
    });
  });

  return map;
}

export async function getReceivingSelectionData(): Promise<PurchaseReceivingSelectionData> {
  const [requestRecords, orderRecords, itemRecords, receivingRecords] =
    await Promise.all([
      airtableFetchAll(REQUEST_TABLE, { cache: "no-store" }),
      airtableFetchAll(ORDER_TABLE, { cache: "no-store" }),
      airtableFetchAll(ORDER_ITEM_TABLE, { cache: "no-store" }),
      airtableFetchAll(RECEIVING_TABLE, { cache: "no-store" }),
    ]);

  const receivingIdsByItemId = createReceivingIdsByItemId(receivingRecords);
  const items = itemRecords.map((record) =>
    mapReceivingItemOption(record, receivingIdsByItemId)
  );

  const orders = orderRecords
    .map((record) => ({
      id: record.id,
      poNo: toString(record.fields["발주번호"]),
      orderDate: toString(record.fields["발주일"]) || undefined,
      createdTime: record.createdTime,
      requestRecordIds: toStringArray(record.fields["PR NO."]) ?? [],
      orderItemRecordIds:
        toStringArray(record.fields["발주상세품목"]) ??
        items
          .filter((item) => item.orderRecordIds.includes(record.id))
          .map((item) => item.id),
      status: normalizePurchaseOrderStatus(record.fields["상태"]),
    }))
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, date: a.orderDate, createdTime: a.createdTime },
        { id: b.id, date: b.orderDate, createdTime: b.createdTime }
      )
    );

  const eligibleOrderIds = new Set(
    orders
      .filter(
        (order) =>
          order.status !== PURCHASE_ORDER_STATUS.CANCELLED &&
          order.status !== PURCHASE_ORDER_STATUS.RECEIVED
      )
      .map((order) => order.id)
  );

  const requests = requestRecords
    .map((record) => {
      const linkedOrderIds = (toStringArray(record.fields["PO NO."]) ?? [])
        .filter((orderId) => {
          const order = orders.find((candidate) => candidate.id === orderId);
          return (
            eligibleOrderIds.has(orderId) &&
            Boolean(order?.requestRecordIds.includes(record.id))
          );
        });

      return {
        id: record.id,
        requestDate: toString(record.fields["요청일"]) || undefined,
        createdTime: record.createdTime,
        prNo: toString(record.fields["PR NO."]),
        title: toString(record.fields["제목"]) || undefined,
        orderRecordIds: linkedOrderIds,
      };
    })
    .filter((request) => request.orderRecordIds.length > 0)
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, date: a.requestDate, createdTime: a.createdTime },
        { id: b.id, date: b.requestDate, createdTime: b.createdTime }
      )
    );

  return { requests, orders, items };
}

export type ReceivingSubmissionContext = {
  request?: { id: string; orderRecordIds: string[] };
  order?: {
    id: string;
    requestRecordIds: string[];
    orderItemRecordIds: string[];
    status?: PurchaseOrderStatus;
  };
  items: PurchaseReceivingItemOption[];
};

async function fetchRecordOrUndefined(tableName: string, recordId: string) {
  try {
    return await airtableFetchRecord(tableName, recordId, { cache: "no-store" });
  } catch (error) {
    if (
      isAirtableNotFoundError(error) ||
      (error instanceof AirtableRepositoryError && error.status === 422)
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function getReceivingSubmissionContext(
  requestRecordId: string,
  orderRecordId: string,
  orderItemRecordIds: string[]
): Promise<ReceivingSubmissionContext> {
  const [requestRecord, orderRecord, itemRecords, receivingRecords] =
    await Promise.all([
      fetchRecordOrUndefined(REQUEST_TABLE, requestRecordId),
      fetchRecordOrUndefined(ORDER_TABLE, orderRecordId),
      Promise.all(
        orderItemRecordIds.map((itemId) =>
          fetchRecordOrUndefined(ORDER_ITEM_TABLE, itemId)
        )
      ),
      airtableFetchAll(RECEIVING_TABLE, { cache: "no-store" }),
    ]);
  const receivingIdsByItemId = createReceivingIdsByItemId(receivingRecords);

  return {
    request: requestRecord
      ? {
          id: requestRecord.id,
          orderRecordIds: toStringArray(requestRecord.fields["PO NO."]) ?? [],
        }
      : undefined,
    order: orderRecord
      ? {
          id: orderRecord.id,
          requestRecordIds: toStringArray(orderRecord.fields["PR NO."]) ?? [],
          orderItemRecordIds:
            toStringArray(orderRecord.fields["발주상세품목"]) ?? [],
          status: normalizePurchaseOrderStatus(orderRecord.fields["상태"]),
        }
      : undefined,
    items: itemRecords
      .filter((record): record is AirtableRecord => Boolean(record))
      .map((record) => mapReceivingItemOption(record, receivingIdsByItemId)),
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
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, date: a.receivingDate, createdTime: a.createdTime },
        { id: b.id, date: b.receivingDate, createdTime: b.createdTime }
      )
    );
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
      발주상세품목: input.orderItemRecordIds,
      입고확인자: input.receivingChecker,
      입고확인일: input.receivingDate,
      검토완료: false,
      비고: input.memo || undefined,
    })
  );

  let completedRecord = receivingRecord;

  try {
    completedRecord = await uploadReceivingAttachments(
      receivingRecord.id,
      "거래명세서",
      input.transactionStatementFiles
    );
    completedRecord = await uploadReceivingAttachments(
      receivingRecord.id,
      "입고증빙",
      input.receivingEvidenceFiles
    );
  } catch (uploadError) {
    try {
      await airtableDeleteRecord(RECEIVING_TABLE, receivingRecord.id);
    } catch {
      throw new PurchaseReceivingUploadError(
        "첨부파일 업로드에 실패했고 생성된 입고확인도 자동 삭제하지 못했습니다. 관리자에게 입고확인 ID " +
          `${receivingRecord.id} 정리를 요청해 주세요.`
      );
    }

    throw uploadError;
  }

  return completedRecord;
}

async function uploadReceivingAttachments(
  receivingRecordId: string,
  fieldName: string,
  files: AirtableUploadFileInput[]
) {
  let uploadedRecord: AirtableRecord | undefined;

  for (const file of files) {
    try {
      uploadedRecord = await airtableUploadAttachment(
        receivingRecordId,
        fieldName,
        file,
        { revalidateTags: [`airtable-${RECEIVING_TABLE}`] }
      );
    } catch {
      throw new PurchaseReceivingUploadError(
        `${fieldName} 파일 '${file.filename}' 업로드에 실패했습니다. 생성된 입고확인은 취소되었습니다.`
      );
    }
  }

  if (!uploadedRecord) {
    throw new PurchaseReceivingUploadError(
      `${fieldName}에 업로드할 파일이 없습니다. 생성된 입고확인은 취소되었습니다.`
    );
  }

  return uploadedRecord;
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
