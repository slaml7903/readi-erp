import { assertAirtableRecordId } from "../validation/purchase-linked-record.validation";
import {
  normalizeVendorInput,
  normalizeVendorName,
  validateVendorInput,
} from "../validation/vendor.validation";
import {
  findAllVendors,
  findVendorById,
  insertVendor,
  updateVendor,
} from "../repository/vendor.repository";
import {
  findDocumentsByIds,
  insertDocumentLink,
  mapDocumentRecord,
  removeDocument,
  uploadDocumentAttachment,
} from "../repository/document.repository";
import { findPurchaseItemsForVendor } from "../repository/vendor-purchase.repository";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import { VENDOR_DOCUMENT_TYPE } from "../config/vendor.config";
import {
  createLatestVendorDocumentMap,
  createVendorDocumentKey,
} from "../utils/vendor-document";
import type {
  CreateVendorDocumentInput,
  CreateVendorInput,
  VendorDetail,
  VendorListItem,
} from "../types/vendor.type";

export class DuplicateVendorNameWarning extends Error {
  constructor(public readonly existingVendorId: string) {
    super("동일한 거래처명이 이미 있습니다. 그래도 등록하시겠습니까?");
    this.name = "DuplicateVendorNameWarning";
  }
}

export async function fetchVendorsForManagement(
  search = ""
): Promise<VendorListItem[]> {
  const vendors = await findAllVendors();
  const keyword = normalizeSearchText(search);
  const filteredVendors = keyword
    ? vendors.filter((vendor) =>
        [vendor.name, vendor.manager]
          .filter((value): value is string => Boolean(value))
          .some((value) => normalizeSearchText(value).includes(keyword))
      )
    : vendors;
  const documentRecordIds = Array.from(
    new Set(filteredVendors.flatMap((vendor) => vendor.documentRecordIds))
  );
  const documents = await findDocumentsByIds(documentRecordIds);
  const latestDocumentsByVendor = createLatestVendorDocumentMap(documents);

  return filteredVendors.map((vendor) => {
    const businessRegistrationDocument = latestDocumentsByVendor.get(
      createVendorDocumentKey(
        vendor.id,
        VENDOR_DOCUMENT_TYPE.businessRegistration
      )
    );
    const bankbookDocument = latestDocumentsByVendor.get(
      createVendorDocumentKey(vendor.id, VENDOR_DOCUMENT_TYPE.bankbookCopy)
    );

    return {
      id: vendor.id,
      name: vendor.name,
      manager: vendor.manager,
      email: vendor.email,
      phone: vendor.phone,
      handledItems: vendor.handledItems,
      memo: vendor.memo,
      businessRegistrationAttachments:
        businessRegistrationDocument?.attachments ?? [],
      bankbookAttachments: bankbookDocument?.attachments ?? [],
    };
  });
}

export async function fetchVendorDetail(recordId: string): Promise<VendorDetail> {
  assertAirtableRecordId(recordId, "거래처 ID");

  const vendor = await findVendorById(recordId);

  if (!vendor) {
    throw new PurchaseValidationError("거래처 정보를 찾을 수 없습니다.");
  }

  const [documents, purchaseItems] = await Promise.all([
    findDocumentsByIds(vendor.documentRecordIds),
    findPurchaseItemsForVendor(recordId, vendor.orderItemRecordIds),
  ]);

  return {
    ...vendor,
    documents: documents
      .filter((document) => document.vendorRecordIds.includes(recordId))
      .sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? "")),
    purchaseItems: purchaseItems.sort((a, b) => {
      const dateOrder = (b.orderDate ?? "").localeCompare(a.orderDate ?? "");
      return dateOrder || (b.orderNumber ?? "").localeCompare(a.orderNumber ?? "");
    }),
  };
}

export async function submitVendor(
  input: CreateVendorInput,
  options: { allowDuplicateName?: boolean } = {}
) {
  const normalizedInput = normalizeVendorInput(input);
  validateVendorInput(normalizedInput);

  const vendors = await findAllVendors();
  const duplicate = vendors.find(
    (vendor) => normalizeVendorName(vendor.name) === normalizeVendorName(normalizedInput.name)
  );

  if (duplicate && !options.allowDuplicateName) {
    throw new DuplicateVendorNameWarning(duplicate.id);
  }

  return insertVendor(normalizedInput);
}

export async function fetchVendorForEdit(recordId: string) {
  assertAirtableRecordId(recordId, "거래처 ID");

  const vendor = await findVendorById(recordId);

  if (!vendor) {
    throw new PurchaseValidationError("거래처 정보를 찾을 수 없습니다.");
  }

  return vendor;
}

export async function submitVendorUpdate(
  recordId: string,
  input: CreateVendorInput,
  options: { allowDuplicateName?: boolean } = {}
) {
  assertAirtableRecordId(recordId, "거래처 ID");

  const normalizedInput = normalizeVendorInput(input);
  validateVendorInput(normalizedInput);

  const [currentVendor, vendors] = await Promise.all([
    findVendorById(recordId),
    findAllVendors(),
  ]);

  if (!currentVendor) {
    throw new PurchaseValidationError("거래처 정보를 찾을 수 없습니다.");
  }

  const duplicate = vendors.find(
    (vendor) =>
      vendor.id !== recordId &&
      normalizeVendorName(vendor.name) === normalizeVendorName(normalizedInput.name)
  );

  if (duplicate && !options.allowDuplicateName) {
    throw new DuplicateVendorNameWarning(duplicate.id);
  }

  return updateVendor(recordId, normalizedInput);
}

export async function submitVendorDocument(input: CreateVendorDocumentInput) {
  assertAirtableRecordId(input.vendorRecordId, "거래처 ID");

  const vendor = await findVendorById(input.vendorRecordId);

  if (!vendor) {
    throw new PurchaseValidationError("존재하지 않는 거래처에는 서류를 등록할 수 없습니다.");
  }

  const documentRecord = await insertDocumentLink(
    input.vendorRecordId,
    input.documentType
  );

  try {
    const uploadedRecord = await uploadDocumentAttachment(
      documentRecord.id,
      input.file
    );

    return mapDocumentRecord(uploadedRecord);
  } catch (error) {
    try {
      await removeDocument(documentRecord.id);
    } catch (rollbackError) {
      console.error({
        scope: "vendor-document-upload-rollback",
        operation: "deleteDocument",
        recordId: documentRecord.id,
        message:
          rollbackError instanceof Error ? rollbackError.message : "Unknown rollback error",
      });
    }

    throw error;
  }
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko");
}
