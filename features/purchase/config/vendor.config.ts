export const VENDOR_TABLE = "05.Vendor";
export const DOCUMENT_TABLE = "06.Documents";

export const VENDOR_FIELDS = {
  name: "공급업체명",
  manager: "담당자",
  email: "이메일",
  phone: "전화번호",
  handledItems: "취급품목",
  memo: "비고",
  documents: "documents",
  orderItems: "03.O-Items",
} as const;

export const DOCUMENT_FIELDS = {
  vendor: "벤더",
  type: "종류",
  attachment: "첨부",
} as const;

export const VENDOR_DOCUMENT_TYPE = {
  businessRegistration: "사업자등록증",
  bankbookCopy: "통장사본",
  msds: "MSDS",
} as const;

export const DOCUMENT_TYPES = Object.values(VENDOR_DOCUMENT_TYPE);

export const ORDER_TABLE = "02.Order";
export const ORDER_ITEM_TABLE = "03.O-Items";

export const ORDER_FIELDS = {
  number: "발주번호",
  orderDate: "발주일",
  poDate: "PO DATE",
} as const;

export const ORDER_ITEM_FIELDS = {
  name: "품명",
  order: "PO NO.",
  vendor: "벤더",
  quantity: "수량",
  unitPrice: "단가",
  vatIncluded: "vat포함",
  totalAmount: "총액",
  status: "상태",
  memo: "비고",
} as const;

export const AIRTABLE_RECORD_QUERY_BATCH_SIZE = 40;

export const VENDOR_DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const VENDOR_DOCUMENT_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
