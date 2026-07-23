import {
  EXPENSE_DOCUMENT_LABELS,
  EXPENSE_EVIDENCE_STATUS,
  EXPENSE_PAGE_SIZE,
  EXPENSE_STATUS,
} from "../config/expense.config";
import { VENDOR_DOCUMENT_TYPE } from "../config/vendor.config";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import { findDocumentsByIds } from "../repository/document.repository";
import {
  findExpenseOrderById,
  findExpenseOrderItemsByIds,
  findExpenseOrders,
  findExpenseRequestsByIds,
  updateExpenseCompleted,
} from "../repository/purchase.repository";
import { findVendorsByIds } from "../repository/vendor.repository";
import type {
  ExpenseEvidenceFilter,
  ExpenseFilters,
  ExpenseListItem,
  ExpenseListResult,
  ExpenseOrderData,
  ExpenseOrderItemData,
  ExpenseStatusFilter,
} from "../types/expense.type";
import type { AirtableAttachment } from "../types/purchase.type";
import { compareLatestFirst } from "@/lib/sort";
import type { Vendor, VendorDocumentAttachment } from "../types/vendor.type";
import {
  createLatestVendorDocumentMap,
  createVendorDocumentKey,
} from "../utils/vendor-document";
import { assertAirtableRecordId } from "../validation/purchase-linked-record.validation";

type ExpenseSearchParams = Record<string, string | string[] | undefined>;

export function parseExpenseFilters(params: ExpenseSearchParams): ExpenseFilters {
  return {
    status: parseExpenseStatus(toSingleValue(params.status)),
    search: (toSingleValue(params.query) ?? toSingleValue(params.q) ?? "").trim(),
    vendorRecordId: parseRecordId(toSingleValue(params.vendor)),
    dateFrom: parseDate(toSingleValue(params.from)),
    dateTo: parseDate(toSingleValue(params.to)),
    minAmount: parseAmount(toSingleValue(params.minAmount)),
    maxAmount: parseAmount(toSingleValue(params.maxAmount)),
    evidence: parseEvidenceStatus(toSingleValue(params.evidence)),
    page: parsePositiveInteger(toSingleValue(params.page), 1),
    pageSize: EXPENSE_PAGE_SIZE,
  };
}

export function parseExpenseStatus(value: string | undefined): ExpenseStatusFilter {
  if (value === EXPENSE_STATUS.completed) return EXPENSE_STATUS.completed;
  if (value === EXPENSE_STATUS.all) return EXPENSE_STATUS.all;
  return EXPENSE_STATUS.waiting;
}

export function parseEvidenceStatus(
  value: string | undefined
): ExpenseEvidenceFilter {
  if (value === EXPENSE_EVIDENCE_STATUS.missing) {
    return EXPENSE_EVIDENCE_STATUS.missing;
  }
  if (value === EXPENSE_EVIDENCE_STATUS.complete) {
    return EXPENSE_EVIDENCE_STATUS.complete;
  }
  return EXPENSE_EVIDENCE_STATUS.all;
}

export async function fetchExpenses(
  filters: ExpenseFilters
): Promise<ExpenseListResult> {
  const orders = await findExpenseOrders(filters.status, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
  });
  const { expenses, vendors } = await assembleExpenses(orders);
  const keyword = normalizeSearch(filters.search);

  let matched = expenses.filter((expense) => {
    if (!matchesStatus(expense, filters.status)) return false;
    if (
      filters.vendorRecordId &&
      !expense.vendorRecordIds.includes(filters.vendorRecordId)
    ) {
      return false;
    }
    if (!keyword) return true;

    return [
      ...expense.requestNumbers,
      expense.orderNumber,
      ...expense.vendorNames,
      ...expense.items.map((item) => item.name),
    ].some((value) => normalizeSearch(value).includes(keyword));
  });

  if (filters.evidence !== EXPENSE_EVIDENCE_STATUS.all) {
    matched = await attachVendorDocuments(matched, vendors);
    matched = matched.filter((expense) =>
      filters.evidence === EXPENSE_EVIDENCE_STATUS.missing
        ? expense.missingDocumentLabels.length > 0
        : expense.missingDocumentLabels.length === 0
    );
  }

  matched.sort((a, b) =>
    compareLatestFirst(
      { id: a.id, date: a.orderDate, createdTime: a.createdTime },
      { id: b.id, date: b.orderDate, createdTime: b.createdTime }
    )
  );

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;
  let items = matched.slice(start, start + filters.pageSize);

  if (filters.evidence === EXPENSE_EVIDENCE_STATUS.all) {
    items = await attachVendorDocuments(items, vendors);
  }

  return {
    items,
    vendors: vendors
      .map((vendor) => ({ id: vendor.id, name: vendor.name }))
      .filter((vendor) => vendor.name)
      .sort((a, b) => a.name.localeCompare(b.name, "ko")),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function fetchExpenseDetail(orderRecordId: string) {
  assertAirtableRecordId(orderRecordId, "발주 ID");
  const order = await findExpenseOrderById(orderRecordId);

  if (!order) throw new PurchaseValidationError("발주 정보를 찾을 수 없습니다.");
  if (!order.needExpense && !order.expenseCompleted) {
    throw new PurchaseValidationError("지출 필요 대상이 아닌 발주입니다.");
  }

  const { expenses, vendors } = await assembleExpenses([order]);
  const [expense] = await attachVendorDocuments(expenses, vendors);

  if (!expense) throw new PurchaseValidationError("지출 정보를 구성할 수 없습니다.");
  return expense;
}

export async function changeExpenseCompleted(
  orderRecordId: string,
  expenseCompleted: boolean
) {
  assertAirtableRecordId(orderRecordId, "발주 ID");
  const order = await findExpenseOrderById(orderRecordId);

  if (!order) throw new PurchaseValidationError("발주 정보를 찾을 수 없습니다.");
  if (!order.needExpense) {
    throw new PurchaseValidationError("지출 필요 대상이 아닌 발주입니다.");
  }
  if (order.expenseCompleted === expenseCompleted) {
    throw new PurchaseValidationError(
      expenseCompleted
        ? "이미 지출완료 처리된 발주입니다."
        : "이미 지출대기 상태인 발주입니다."
    );
  }

  return updateExpenseCompleted(orderRecordId, expenseCompleted);
}

async function assembleExpenses(orders: ExpenseOrderData[]) {
  const requestRecordIds = unique(orders.flatMap((order) => order.requestRecordIds));
  const orderItemRecordIds = unique(
    orders.flatMap((order) => order.orderItemRecordIds)
  );
  const [requests, orderItems] = await Promise.all([
    findExpenseRequestsByIds(requestRecordIds),
    findExpenseOrderItemsByIds(orderItemRecordIds),
  ]);
  const vendorRecordIds = unique(orderItems.flatMap((item) => item.vendorRecordIds));
  const vendors = await findVendorsByIds(vendorRecordIds);
  const requestMap = new Map(requests.map((request) => [request.id, request]));
  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const orderItemMap = groupItemsByOrder(orderItems);

  const expenses = orders.map((order): ExpenseListItem => {
    const linkedRequests = order.requestRecordIds
      .map((recordId) => requestMap.get(recordId))
      .filter((request) => request !== undefined);
    const linkedItems = orderItemMap.get(order.id) ?? [];
    const linkedVendorIds = unique(linkedItems.flatMap((item) => item.vendorRecordIds));
    const approvalFiles = dedupeAttachments(
      linkedRequests.flatMap((request) => request.approvalFiles)
    );
    const requestFormFiles = dedupeAttachments(
      linkedRequests.flatMap((request) => request.requestFormFiles)
    );
    const quotationFiles = dedupeAttachments(
      linkedRequests.flatMap((request) => request.quotationFiles)
    );

    return createExpenseItem({
      order,
      linkedItems,
      linkedVendorIds,
      vendorNames: linkedVendorIds
        .map((id) => vendorMap.get(id)?.name)
        .filter((name): name is string => Boolean(name)),
      requestNumbers: linkedRequests
        .map((request) => request.requestNumber)
        .filter(Boolean),
      approvalFiles,
      requestFormFiles,
      quotationFiles,
      businessRegistrationFiles: [],
      bankbookFiles: [],
    });
  });

  return { expenses, vendors };
}

async function attachVendorDocuments(
  expenses: ExpenseListItem[],
  vendors: Vendor[]
) {
  if (expenses.length === 0) return expenses;
  const usedVendorIds = new Set(expenses.flatMap((expense) => expense.vendorRecordIds));
  const usedVendors = vendors.filter((vendor) => usedVendorIds.has(vendor.id));
  const documentIds = unique(usedVendors.flatMap((vendor) => vendor.documentRecordIds));
  const documents = await findDocumentsByIds(documentIds);
  const latestMap = createLatestVendorDocumentMap(documents);

  return expenses.map((expense) =>
    createExpenseItem({
      order: {
        id: expense.id,
        createdTime: expense.createdTime,
        orderNumber: expense.orderNumber,
        requestRecordIds: [],
        orderItemRecordIds: [],
        orderDate: expense.orderDate,
        totalAmount: expense.amount,
        needExpense: expense.needExpense,
        expenseCompleted: expense.expenseCompleted,
        purchaseOrderFiles: expense.purchaseOrderFiles,
        memo: expense.memo,
      },
      linkedItems: expense.items,
      linkedVendorIds: expense.vendorRecordIds,
      vendorNames: expense.vendorNames,
      requestNumbers: expense.requestNumbers,
      approvalFiles: expense.approvalFiles,
      requestFormFiles: expense.requestFormFiles,
      quotationFiles: expense.quotationFiles,
      businessRegistrationFiles: getVendorDocumentFiles(
        expense.vendorRecordIds,
        VENDOR_DOCUMENT_TYPE.businessRegistration,
        latestMap
      ),
      bankbookFiles: getVendorDocumentFiles(
        expense.vendorRecordIds,
        VENDOR_DOCUMENT_TYPE.bankbookCopy,
        latestMap
      ),
    })
  );
}

function createExpenseItem(input: {
  order: ExpenseOrderData;
  linkedItems: ExpenseOrderItemData[];
  linkedVendorIds: string[];
  vendorNames: string[];
  requestNumbers: string[];
  approvalFiles: AirtableAttachment[];
  requestFormFiles: AirtableAttachment[];
  quotationFiles: AirtableAttachment[];
  businessRegistrationFiles: AirtableAttachment[];
  bankbookFiles: AirtableAttachment[];
}): ExpenseListItem {
  const purchaseOrderFiles = dedupeAttachments(input.order.purchaseOrderFiles);
  const amount =
    input.order.totalAmount ??
    input.order.grossAmount ??
    input.linkedItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const files = {
    approvalFiles: input.approvalFiles,
    requestFormFiles: input.requestFormFiles,
    quotationFiles: input.quotationFiles,
    purchaseOrderFiles,
    businessRegistrationFiles: input.businessRegistrationFiles,
    bankbookFiles: input.bankbookFiles,
  };

  return {
    id: input.order.id,
    createdTime: input.order.createdTime,
    requestNumbers: input.requestNumbers,
    orderNumber: input.order.orderNumber,
    orderDate: input.order.orderDate,
    vendorNames: input.vendorNames,
    vendorRecordIds: input.linkedVendorIds,
    itemSummary: createItemSummary(input.linkedItems),
    items: input.linkedItems,
    amount,
    ...files,
    needExpense: input.order.needExpense,
    expenseCompleted: input.order.expenseCompleted,
    missingDocumentLabels: getMissingDocumentLabels(files),
    memo: input.order.memo,
    vatIncludedLabel: createVatIncludedLabel(input.linkedItems),
  };
}

function matchesStatus(expense: ExpenseListItem, status: ExpenseStatusFilter) {
  if (status === EXPENSE_STATUS.all) {
    return expense.needExpense || expense.expenseCompleted;
  }
  return status === EXPENSE_STATUS.completed
    ? expense.expenseCompleted
    : expense.needExpense && !expense.expenseCompleted;
}

function groupItemsByOrder(items: ExpenseOrderItemData[]) {
  const map = new Map<string, ExpenseOrderItemData[]>();
  items.forEach((item) => {
    item.orderRecordIds.forEach((orderRecordId) => {
      map.set(orderRecordId, [...(map.get(orderRecordId) ?? []), item]);
    });
  });
  return map;
}

function createItemSummary(items: ExpenseOrderItemData[]) {
  if (items.length === 0) return "-";
  if (items.length === 1) return items[0].name || "-";
  return `${items[0].name || "품명 없음"} 외 ${items.length - 1}건`;
}

function createVatIncludedLabel(items: ExpenseOrderItemData[]) {
  if (items.length === 0) return "-";
  if (items.every((item) => item.vatIncluded)) return "포함";
  if (items.every((item) => !item.vatIncluded)) return "미포함";
  return "혼합";
}

function getVendorDocumentFiles(
  vendorRecordIds: string[],
  documentType: string,
  documentMap: ReturnType<typeof createLatestVendorDocumentMap>
) {
  return dedupeAttachments(
    vendorRecordIds.flatMap((vendorRecordId) => {
      const document = documentMap.get(
        createVendorDocumentKey(vendorRecordId, documentType)
      );
      return (document?.attachments ?? []).map(toAirtableAttachment);
    })
  );
}

function toAirtableAttachment(attachment: VendorDocumentAttachment): AirtableAttachment {
  return {
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    size: attachment.size,
    type: attachment.contentType,
  };
}

function dedupeAttachments(attachments: AirtableAttachment[]) {
  return Array.from(
    new Map(attachments.map((attachment) => [attachment.id, attachment])).values()
  );
}

function getMissingDocumentLabels(files: {
  approvalFiles: AirtableAttachment[];
  requestFormFiles: AirtableAttachment[];
  quotationFiles: AirtableAttachment[];
  purchaseOrderFiles: AirtableAttachment[];
  businessRegistrationFiles: AirtableAttachment[];
  bankbookFiles: AirtableAttachment[];
}) {
  const counts = [
    files.approvalFiles.length,
    files.requestFormFiles.length,
    files.quotationFiles.length,
    files.purchaseOrderFiles.length,
    files.businessRegistrationFiles.length,
    files.bankbookFiles.length,
  ];
  return EXPENSE_DOCUMENT_LABELS.filter((_, index) => counts[index] === 0);
}

function parseRecordId(value: string | undefined) {
  return value && /^rec[A-Za-z0-9]{14}$/.test(value) ? value : undefined;
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? undefined : value;
}

function parseAmount(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko");
}
