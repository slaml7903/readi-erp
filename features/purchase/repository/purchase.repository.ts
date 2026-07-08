import {
  airtableCreateRecord,
  airtableCreateRecords,
  airtableFetchAll,
  airtableUploadAttachment,
} from "@/lib/airtable/client";

import type {
  AirtableAttachment,
  CreatePurchaseOrderInput,
  CreatePurchaseRequestInput,
  PurchaseOrderItemSummary,
  PurchaseOrderSummary,
  PurchaseReceivingSummary,
  PurchaseRequest,
  PurchaseVendorOption,
} from "../types/purchase.type";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

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

  return value
    .map((item) => String(item))
    .filter((item) => item.length > 0);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (Array.isArray(value)) {
    const first = value[0];

    if (typeof first === "number") return first;

    if (typeof first === "string") {
      const parsed = Number(first.replaceAll(",", ""));
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }

  return 0;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
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

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function getPurchaseRequests(): Promise<PurchaseRequest[]> {
  const [
    requestRecords,
    orderRecords,
    projectRecords,
    receivingRecords,
    orderItemRecords,
    itemRecords,
    vendorRecords,
  ] = await Promise.all([
    airtableFetchAll("01.P-RQST"),
    airtableFetchAll("02.Order"),
    airtableFetchAll("00.Project"),
    airtableFetchAll("02-1.RCV"),
    airtableFetchAll("03.O-Items"),
    airtableFetchAll("04.Item"),
    airtableFetchAll("05.Vendor"),
  ]);

  const itemNameMap = createItemNameMap(itemRecords);
  const vendorNameMap = createVendorNameMap(vendorRecords);

  const orderItemMap = createOrderItemMap(
    orderItemRecords,
    itemNameMap,
    vendorNameMap
  );

  const receivingSummaryMap = createReceivingSummaryMap(receivingRecords);

  const orderSummaryMap = createOrderSummaryMap(
    orderRecords,
    orderItemMap,
    receivingSummaryMap
  );

  const projectNameMap = createProjectNameMap(projectRecords);

  return requestRecords.map((record) => {
    const fields = record.fields;

    const orderRecordIds = toStringArray(fields["PO NO."]);

    const orderSummaries = orderRecordIds
      ?.map((orderRecordId) => orderSummaryMap.get(orderRecordId))
      .filter(
        (orderSummary): orderSummary is PurchaseOrderSummary =>
          Boolean(orderSummary)
      );

    const orderNos = orderSummaries?.map((order) => order.poNo);

    const projectIds = toStringArray(fields["프로젝트"]);

    const projectNames = projectIds
      ?.map((projectId) => projectNameMap.get(projectId))
      .filter((projectName): projectName is string => Boolean(projectName));

    return {
      id: record.id,

      prNo: toString(fields["PR NO."]),
      title: toString(fields["제목"]),

      requestDate: toString(fields["요청일"]) || undefined,
      requiredDate: toString(fields["필요일자"]) || undefined,

      teamName: toString(fields["팀명"]) || undefined,
      requester: toString(fields["요청자"]) || undefined,

      projectIds,
      projectNames,

      status: toString(fields["상태"]) || undefined,

      approvalFiles: toAttachments(fields["PR 승인"]),
      requestFormFiles: toAttachments(fields["구매요청서"]),
      quotationFiles: toAttachments(fields["견적서"]),

      vendorNames: toStringArray(fields["벤더"]),
      totalAmount: toNumber(fields["지출액"]),

      memo: toString(fields["비고"]) || undefined,

      orderRecordIds,
      orderNos,
      orderItemNames: toStringArray(fields["발주상세품목"]),
      orderSummaries,
    };
  });
}

export async function getPurchaseVendors(): Promise<PurchaseVendorOption[]> {
  const records = await airtableFetchAll("05.Vendor");

  return records
    .map((record) => ({
      id: record.id,
      name: toString(record.fields["공급업체명"]),
    }))
    .filter((vendor) => vendor.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

async function resolveVendorRecordIdsByOrder(
  orders: CreatePurchaseOrderInput[]
) {
  const vendorOptions = await getPurchaseVendors();

  const vendorIdByNormalizedName = new Map<string, string>();

  vendorOptions.forEach((vendor) => {
    vendorIdByNormalizedName.set(normalizeName(vendor.name), vendor.id);
  });

  const vendorRecordIdByOrderIndex = new Map<number, string>();
  const newlyCreatedVendorIdsByNormalizedName = new Map<string, string>();

  for (let orderIndex = 0; orderIndex < orders.length; orderIndex += 1) {
    const order = orders[orderIndex];

    if (order.vendorRecordId) {
      vendorRecordIdByOrderIndex.set(orderIndex, order.vendorRecordId);
      continue;
    }

    const vendorName = order.vendorName?.trim();

    if (!vendorName) continue;

    const normalizedVendorName = normalizeName(vendorName);

    const existingVendorId = vendorIdByNormalizedName.get(normalizedVendorName);

    if (existingVendorId) {
      vendorRecordIdByOrderIndex.set(orderIndex, existingVendorId);
      continue;
    }

    const alreadyCreatedVendorId =
      newlyCreatedVendorIdsByNormalizedName.get(normalizedVendorName);

    if (alreadyCreatedVendorId) {
      vendorRecordIdByOrderIndex.set(orderIndex, alreadyCreatedVendorId);
      continue;
    }

    const vendorRecord = await airtableCreateRecord(
      "05.Vendor",
      removeUndefinedFields({
        공급업체명: vendorName,
      })
    );

    vendorRecordIdByOrderIndex.set(orderIndex, vendorRecord.id);
    newlyCreatedVendorIdsByNormalizedName.set(
      normalizedVendorName,
      vendorRecord.id
    );
  }

  return {
    vendorRecordIdByOrderIndex,
    newlyCreatedVendorIdsByNormalizedName,
  };
}

async function createNewVendorDocuments(
  orders: CreatePurchaseOrderInput[],
  vendorRecordIdByOrderIndex: Map<number, string>,
  newlyCreatedVendorIdsByNormalizedName: Map<string, string>
) {
  const createdDocumentKeySet = new Set<string>();
  const createdDocumentRecords: AirtableRecord[] = [];

  for (let orderIndex = 0; orderIndex < orders.length; orderIndex += 1) {
    const order = orders[orderIndex];
    const vendorName = order.vendorName?.trim();

    if (!vendorName) continue;

    const normalizedVendorName = normalizeName(vendorName);
    const vendorRecordId = vendorRecordIdByOrderIndex.get(orderIndex);
    const newlyCreatedVendorId =
      newlyCreatedVendorIdsByNormalizedName.get(normalizedVendorName);

    if (!vendorRecordId || !newlyCreatedVendorId) continue;

    const businessLicenseFile = order.newVendorDocuments?.businessLicenseFile;
    const bankbookFile = order.newVendorDocuments?.bankbookFile;

    if (businessLicenseFile) {
      const documentRecord = await createVendorDocumentWithAttachment({
        vendorRecordId,
        documentType: "사업자등록증",
        file: businessLicenseFile,
        createdDocumentKeySet,
      });

      if (documentRecord) {
        createdDocumentRecords.push(documentRecord);
      }
    }

    if (bankbookFile) {
      const documentRecord = await createVendorDocumentWithAttachment({
        vendorRecordId,
        documentType: "통장사본",
        file: bankbookFile,
        createdDocumentKeySet,
      });

      if (documentRecord) {
        createdDocumentRecords.push(documentRecord);
      }
    }
  }

  return createdDocumentRecords;
}

async function createVendorDocumentWithAttachment({
  vendorRecordId,
  documentType,
  file,
  createdDocumentKeySet,
}: {
  vendorRecordId: string;
  documentType: string;
  file: {
    filename: string;
    contentType: string;
    file: string;
  };
  createdDocumentKeySet: Set<string>;
}) {
  const documentKey = `${vendorRecordId}-${documentType}`;

  if (createdDocumentKeySet.has(documentKey)) {
    return undefined;
  }

  const documentRecord = await airtableCreateRecord(
    "06.Documents",
    removeUndefinedFields({
      벤더: [vendorRecordId],
      종류: documentType,
    })
  );

  createdDocumentKeySet.add(documentKey);

  return await airtableUploadAttachment(documentRecord.id, "첨부", file);
}

export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput
) {
  const {
    vendorRecordIdByOrderIndex,
    newlyCreatedVendorIdsByNormalizedName,
  } = await resolveVendorRecordIdsByOrder(input.orders);

  await createNewVendorDocuments(
    input.orders,
    vendorRecordIdByOrderIndex,
    newlyCreatedVendorIdsByNormalizedName
  );

  const requestRecord = await airtableCreateRecord(
    "01.P-RQST",
    removeUndefinedFields({
      제목: input.title,
      팀명: input.teamName,
      요청자: input.requester,
      요청일: input.requestDate || undefined,
      필요일자: input.requiredDate || undefined,
      상태: "요청됨",
      비고: input.memo || undefined,
    })
  );

  const orderFieldsList = input.orders.map((order) =>
    removeUndefinedFields({
      "PR NO.": [requestRecord.id],
      발주일: order.orderDate || undefined,
      "예상 입고일": order.expectedReceivingDate || undefined,
      입고확인자: order.receivingChecker || undefined,
      지출필요: order.needPayment,
      비고: order.memo || undefined,
    })
  );

  const orderRecords = await airtableCreateRecords("02.Order", orderFieldsList);

  const itemFieldsList = input.orders.flatMap((order, orderIndex) => {
    const orderRecord = orderRecords[orderIndex];
    const vendorRecordId = vendorRecordIdByOrderIndex.get(orderIndex);

    if (!orderRecord) return [];

    return order.items.map((item) =>
      removeUndefinedFields({
        "PO NO.": [orderRecord.id],
        "발주상세(모델명)": item.modelName,
        벤더: vendorRecordId ? [vendorRecordId] : undefined,
        수량: item.quantity,
        단가: item.unitPrice,
        vat포함: item.vatIncluded,
        비고: item.memo || undefined,
      })
    );
  });

  const itemRecords = await airtableCreateRecords(
    "03.O-Items",
    itemFieldsList
  );

  return {
    request: requestRecord,
    orders: orderRecords.map((orderRecord, orderIndex) => {
      const inputOrder = input.orders[orderIndex];

      const startIndex = input.orders
        .slice(0, orderIndex)
        .reduce((total, order) => total + order.items.length, 0);

      const endIndex = startIndex + inputOrder.items.length;

      return {
        order: orderRecord,
        items: itemRecords.slice(startIndex, endIndex),
      };
    }),
  };
}

function createOrderSummaryMap(
  records: AirtableRecord[],
  orderItemMap: Map<string, PurchaseOrderItemSummary[]>,
  receivingSummaryMap: Map<string, PurchaseReceivingSummary>
) {
  const map = new Map<string, PurchaseOrderSummary>();

  records.forEach((record) => {
    const fields = record.fields;

    const poNo = toString(fields["발주번호"]);

    if (!poNo) return;

    const receivingRecordIds = toStringArray(fields["입고확인"]);

    const receivingSummaries = receivingRecordIds
      ?.map((receivingRecordId) => receivingSummaryMap.get(receivingRecordId))
      .filter(
        (receivingSummary): receivingSummary is PurchaseReceivingSummary =>
          Boolean(receivingSummary)
      );

    map.set(record.id, {
      id: record.id,
      poNo,
      title: toString(fields["제목"]) || undefined,
      status: toString(fields["상태"]) || undefined,
      orderDate: toString(fields["발주일"]) || undefined,
      expectedReceivingDate: toString(fields["예상 입고일"]) || undefined,
      receivingChecker: toString(fields["입고확인자"]) || undefined,
      vendorNames: toStringArray(fields["벤더"]),
      totalAmount: toNumber(fields["공급가액(VAT포함)"]),
      needPayment: toBoolean(fields["지출필요"]),
      paymentCompleted: toBoolean(fields["지출완료"]),
      purchaseOrderFiles: toAttachments(fields["발주서"]),
      orderItems: orderItemMap.get(record.id),
      receivingRecordIds,
      receivingSummaries,
    });
  });

  return map;
}

function createOrderItemMap(
  records: AirtableRecord[],
  itemNameMap: Map<string, string>,
  vendorNameMap: Map<string, string>
) {
  const map = new Map<string, PurchaseOrderItemSummary[]>();

  records.forEach((record) => {
    const fields = record.fields;

    const poRecordIds = toStringArray(fields["PO NO."]);

    if (!poRecordIds || poRecordIds.length === 0) return;

    const itemRecordIds = toStringArray(fields["품목"]);

    const itemNames = itemRecordIds
      ?.map((itemRecordId) => itemNameMap.get(itemRecordId))
      .filter((itemName): itemName is string => Boolean(itemName));

    const vendorRecordIds = toStringArray(fields["벤더"]);

    const vendorNames = vendorRecordIds
      ?.map((vendorRecordId) => vendorNameMap.get(vendorRecordId))
      .filter((vendorName): vendorName is string => Boolean(vendorName));

    const orderItem: PurchaseOrderItemSummary = {
      id: record.id,
      modelName: toString(fields["발주상세(모델명)"]),
      itemRecordIds,
      itemNames,
      vendorRecordIds,
      vendorNames,
      quantity: toNumber(fields["수량"]),
      unitPrice: toNumber(fields["단가"]),
      amount: toNumber(fields["총액"]),
      vatIncluded: toBoolean(fields["vat포함"]),
      supplyAmount: toNumber(fields["공급가액 총액"]),
      vatAmount: toNumber(fields["부가세"]),
      teamNames: toStringArray(fields["팀명"]),
      memo: toString(fields["비고"]) || undefined,
    };

    poRecordIds.forEach((poRecordId) => {
      const previousItems = map.get(poRecordId) ?? [];
      map.set(poRecordId, [...previousItems, orderItem]);
    });
  });

  return map;
}

function createReceivingSummaryMap(records: AirtableRecord[]) {
  const map = new Map<string, PurchaseReceivingSummary>();

  records.forEach((record) => {
    const fields = record.fields;

    const receivingNo = toString(fields["입고확인"]);

    if (!receivingNo) return;

    map.set(record.id, {
      id: record.id,
      receivingNo,
      title: toString(fields["제목"]) || undefined,
      receivingChecker: toString(fields["입고확인자"]) || undefined,
      receivingDate: toString(fields["입고확인일"]) || undefined,
      reviewCompleted: toBoolean(fields["검토완료"]),
      memo: toString(fields["비고"]) || undefined,
      transactionStatementFiles: toAttachments(fields["거래명세서"]),
      receivingEvidenceFiles: toAttachments(fields["입고증빙"]),
    });
  });

  return map;
}

function createProjectNameMap(records: AirtableRecord[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    const projectName = toString(record.fields["프로젝트명"]);

    if (projectName) {
      map.set(record.id, projectName);
    }
  });

  return map;
}

function createItemNameMap(records: AirtableRecord[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    const itemName = toString(record.fields["품명"]);

    if (itemName) {
      map.set(record.id, itemName);
    }
  });

  return map;
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
