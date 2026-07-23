import type { DOCUMENT_TYPES } from "../config/vendor.config";

export type VendorDocumentType = (typeof DOCUMENT_TYPES)[number];

export type Vendor = {
  id: string;
  createdTime?: string;
  name: string;
  manager?: string;
  email?: string;
  phone?: string;
  handledItems?: string;
  memo?: string;
  documentRecordIds: string[];
  orderItemRecordIds: string[];
};

export type VendorDocumentAttachment = {
  id: string;
  url: string;
  filename: string;
  size?: number;
  contentType?: string;
};

export type VendorDocument = {
  id: string;
  vendorRecordIds: string[];
  type: VendorDocumentType | string;
  attachments: VendorDocumentAttachment[];
  registeredAt?: string;
};

export type VendorDetail = Vendor & {
  documents: VendorDocument[];
  purchaseItems: VendorPurchaseItem[];
};

export type VendorListItem = Omit<
  Vendor,
  "documentRecordIds" | "orderItemRecordIds"
> & {
  businessRegistrationAttachments: VendorDocumentAttachment[];
  bankbookAttachments: VendorDocumentAttachment[];
};

export type VendorPurchaseItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  vatIncluded: boolean;
  status?: string;
  memo?: string;
  orderRecordId?: string;
  orderNumber?: string;
  orderDate?: string;
};

export type CreateVendorInput = {
  name: string;
  manager?: string;
  email?: string;
  phone?: string;
  handledItems?: string;
  memo?: string;
};

export type CreateVendorDocumentInput = {
  vendorRecordId: string;
  documentType: VendorDocumentType;
  file: {
    filename: string;
    contentType: string;
    file: string;
  };
};
