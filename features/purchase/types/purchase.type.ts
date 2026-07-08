export type PurchaseRequestStatus = string;
export type PurchaseOrderStatus = string;
export type TeamName = string;

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
}

export interface PurchaseVendorOption {
  id: string;
  name: string;
}

export interface PurchaseRequest {
  id: string;

  prNo: string;
  title: string;

  requestDate?: string;
  requiredDate?: string;

  teamName?: TeamName;
  requester?: string;

  projectIds?: string[];
  projectNames?: string[];

  status?: PurchaseRequestStatus;

  approvalFiles?: AirtableAttachment[];
  requestFormFiles?: AirtableAttachment[];
  quotationFiles?: AirtableAttachment[];

  vendorNames?: string[];
  totalAmount?: number;

  memo?: string;

  orderRecordIds?: string[];
  orderNos?: string[];
  orderItemNames?: string[];

  orderSummaries?: PurchaseOrderSummary[];
}

export interface PurchaseOrderSummary {
  id: string;
  poNo: string;
  title?: string;
  status?: PurchaseOrderStatus;
  orderDate?: string;
  expectedReceivingDate?: string;
  receivingChecker?: string;
  vendorNames?: string[];
  totalAmount?: number;
  needPayment?: boolean;
  paymentCompleted?: boolean;

  purchaseOrderFiles?: AirtableAttachment[];

  orderItems?: PurchaseOrderItemSummary[];

  receivingRecordIds?: string[];
  receivingSummaries?: PurchaseReceivingSummary[];
}

export interface PurchaseOrderItemSummary {
  id: string;

  modelName: string;

  itemRecordIds?: string[];
  itemNames?: string[];

  vendorRecordIds?: string[];
  vendorNames?: string[];

  quantity?: number;
  unitPrice?: number;
  amount?: number;

  vatIncluded?: boolean;
  supplyAmount?: number;
  vatAmount?: number;

  teamNames?: string[];

  memo?: string;
}

export interface PurchaseReceivingSummary {
  id: string;
  receivingNo: string;
  title?: string;
  receivingChecker?: string;
  receivingDate?: string;
  reviewCompleted?: boolean;
  memo?: string;

  transactionStatementFiles?: AirtableAttachment[];
  receivingEvidenceFiles?: AirtableAttachment[];
}

export interface PurchaseOrder {
  id: string;

  poNo: string;
  title?: string;

  prIds?: string[];

  teamNames?: TeamName[];
  receivingChecker?: string;

  orderItemIds?: string[];
  vendorNames?: string[];

  status?: PurchaseOrderStatus;

  orderDate?: string;
  expectedReceivingDate?: string;

  purchaseOrderFiles?: AirtableAttachment[];

  totalAmount?: number;
  needPayment?: boolean;
  paymentCompleted?: boolean;

  receivingIds?: string[];

  memo?: string;
  paymentMemo?: string;
}

export interface PurchaseOrderItem {
  id: string;

  itemName: string;

  itemIds?: string[];
  itemMasterIds?: string[];

  poIds?: string[];

  vendorIds?: string[];
  vendorNames?: string[];

  specification?: string;
  unit?: string;

  quantity?: number;
  unitPrice?: number;
  amount?: number;

  vatIncluded?: boolean;
  supplyAmount?: number;
  vatAmount?: number;

  teamNames?: TeamName[];

  isManagedItem?: boolean;

  memo?: string;
}

export interface PurchaseReceiving {
  id: string;

  receivingNo: string;

  poIds?: string[];
  title?: string;

  receivingChecker?: string;
  receivingDate?: string;

  transactionStatementFiles?: AirtableAttachment[];
  receivingEvidenceFiles?: AirtableAttachment[];

  reviewCompleted?: boolean;

  memo?: string;
}

export interface PurchaseReceivingOrderDetail {
  id: string;
  poNo: string;
  title?: string;
  status?: PurchaseOrderStatus;
  expectedReceivingDate?: string;
  receivingChecker?: string;
  vendorNames?: string[];
  items: PurchaseOrderItemSummary[];
}

export interface PurchaseReceivingReviewItem {
  id: string;
  receivingNo: string;
  poRecordIds?: string[];
  poNos?: string[];
  title?: string;
  receivingChecker?: string;
  receivingDate?: string;
  reviewCompleted: boolean;
  memo?: string;
  transactionStatementFiles?: AirtableAttachment[];
  receivingEvidenceFiles?: AirtableAttachment[];
}

export interface SubmitPurchaseReceivingInput {
  orderRecordId: string;
  receivingChecker: string;
  receivingDate: string;
  memo?: string;
  transactionStatementFile?: CreateAirtableAttachmentInput;
  receivingEvidenceFile?: CreateAirtableAttachmentInput;
}

export interface CreatePurchaseRequestInput {
  title: string;
  teamName: string;
  requester: string;
  requestDate?: string;
  requiredDate?: string;
  memo?: string;
  orders: CreatePurchaseOrderInput[];
}

export interface CreatePurchaseOrderInput {
  vendorRecordId?: string;
  vendorName?: string;
  newVendorDocuments?: CreateNewVendorDocumentsInput;
  orderDate?: string;
  expectedReceivingDate?: string;
  receivingChecker?: string;
  needPayment: boolean;
  memo?: string;
  items: CreatePurchaseOrderItemInput[];
}

export interface CreateNewVendorDocumentsInput {
  businessLicenseFile?: CreateAirtableAttachmentInput;
  bankbookFile?: CreateAirtableAttachmentInput;
}

export interface CreateAirtableAttachmentInput {
  filename: string;
  contentType: string;
  file: string;
}

export interface CreatePurchaseOrderItemInput {
  modelName: string;
  quantity: number;
  unitPrice: number;
  vatIncluded: boolean;
  memo?: string;
}
