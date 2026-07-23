import type { AirtableAttachment } from "./purchase.type";

import type {
  EXPENSE_EVIDENCE_STATUS,
  EXPENSE_STATUS,
} from "../config/expense.config";

export type ExpenseStatusFilter =
  (typeof EXPENSE_STATUS)[keyof typeof EXPENSE_STATUS];

export type ExpenseEvidenceFilter =
  (typeof EXPENSE_EVIDENCE_STATUS)[keyof typeof EXPENSE_EVIDENCE_STATUS];

export type ExpenseFilters = {
  status: ExpenseStatusFilter;
  search: string;
  vendorRecordId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  evidence: ExpenseEvidenceFilter;
  page: number;
  pageSize: number;
};

export type ExpenseOrderData = {
  id: string;
  createdTime?: string;
  orderNumber: string;
  requestRecordIds: string[];
  orderItemRecordIds: string[];
  orderDate?: string;
  totalAmount?: number;
  grossAmount?: number;
  needExpense: boolean;
  expenseCompleted: boolean;
  purchaseOrderFiles: AirtableAttachment[];
  memo?: string;
};

export type ExpenseRequestData = {
  id: string;
  requestNumber: string;
  approvalFiles: AirtableAttachment[];
  requestFormFiles: AirtableAttachment[];
  quotationFiles: AirtableAttachment[];
};

export type ExpenseOrderItemData = {
  id: string;
  name: string;
  orderRecordIds: string[];
  vendorRecordIds: string[];
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  vatIncluded: boolean;
  memo?: string;
  status?: string;
};

export type ExpenseListItem = {
  id: string;
  createdTime?: string;
  requestNumbers: string[];
  orderNumber: string;
  orderDate?: string;
  vendorNames: string[];
  vendorRecordIds: string[];
  itemSummary: string;
  items: ExpenseOrderItemData[];
  amount: number;
  approvalFiles: AirtableAttachment[];
  requestFormFiles: AirtableAttachment[];
  quotationFiles: AirtableAttachment[];
  purchaseOrderFiles: AirtableAttachment[];
  businessRegistrationFiles: AirtableAttachment[];
  bankbookFiles: AirtableAttachment[];
  needExpense: boolean;
  expenseCompleted: boolean;
  missingDocumentLabels: string[];
  memo?: string;
  vatIncludedLabel: string;
};

export type ExpenseVendorOption = {
  id: string;
  name: string;
};

export type ExpenseListResult = {
  items: ExpenseListItem[];
  vendors: ExpenseVendorOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
