export const EXPENSE_STATUS = {
  waiting: "waiting",
  completed: "completed",
  all: "all",
} as const;

export const EXPENSE_TABLES = {
  request: "01.P-RQST",
  order: "02.Order",
  orderItem: "03.O-Items",
} as const;

export const EXPENSE_ORDER_VIEW = "00.발주 통합";

export const EXPENSE_EVIDENCE_STATUS = {
  all: "all",
  missing: "missing",
  complete: "complete",
} as const;

export const EXPENSE_PAGE_SIZE = 20;

export const EXPENSE_ORDER_FIELDS = {
  orderNumber: "발주번호",
  requestLinks: "PR NO.",
  orderItemLinks: "발주상세품목",
  orderDate: "발주일",
  purchaseOrderFiles: "발주서",
  needExpense: "지출필요",
  expenseCompleted: "지출완료",
  totalAmount: "총액",
  grossAmount: "발주총액(VAT포함)",
  memo: "비고",
} as const;

export const EXPENSE_REQUEST_FIELDS = {
  requestNumber: "PR NO.",
  approvalFiles: "PR 승인",
  requestFormFiles: "구매요청서",
  quotationFiles: "견적서",
} as const;

export const EXPENSE_ORDER_ITEM_FIELDS = {
  name: "품명",
  orderLinks: "PO NO.",
  vendorLinks: "벤더",
  quantity: "수량",
  unitPrice: "단가",
  totalAmount: "총액",
  vatIncluded: "vat포함",
  memo: "비고",
  status: "상태",
} as const;

export const EXPENSE_DOCUMENT_LABELS = [
  "기안서",
  "구매요청서",
  "견적서",
  "발주서",
  "사업자등록증",
  "통장사본",
] as const;
