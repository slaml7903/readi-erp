import {
  DOCUMENT_TYPES,
  VENDOR_DOCUMENT_FILE_TYPES,
  VENDOR_DOCUMENT_MAX_FILE_SIZE,
} from "../config/vendor.config";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import type {
  CreateVendorInput,
  VendorDocumentType,
} from "../types/vendor.type";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeVendorInput(input: CreateVendorInput): CreateVendorInput {
  return {
    name: input.name?.trim().replace(/\s+/g, " ") ?? "",
    manager: normalizeOptionalText(input.manager),
    email: normalizeOptionalText(input.email)?.toLowerCase(),
    phone: normalizeOptionalText(input.phone),
    handledItems: normalizeOptionalText(input.handledItems),
    memo: normalizeOptionalText(input.memo),
  };
}

export function normalizeVendorName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko");
}

export function validateVendorInput(input: CreateVendorInput) {
  if (!input.name) {
    throw new PurchaseValidationError("거래처명은 필수입니다.");
  }

  if (input.name.length > 100) {
    throw new PurchaseValidationError("거래처명은 100자 이하로 입력해 주세요.");
  }

  if (input.email && !EMAIL_PATTERN.test(input.email)) {
    throw new PurchaseValidationError("이메일 형식이 올바르지 않습니다.");
  }
}

export function parseVendorDocumentType(value: string): VendorDocumentType {
  if (!DOCUMENT_TYPES.includes(value as VendorDocumentType)) {
    throw new PurchaseValidationError("허용되지 않은 서류 유형입니다.");
  }

  return value as VendorDocumentType;
}

export function validateVendorDocumentFile(file: File) {
  if (file.size <= 0) {
    throw new PurchaseValidationError("빈 파일은 업로드할 수 없습니다.");
  }

  if (file.size > VENDOR_DOCUMENT_MAX_FILE_SIZE) {
    throw new PurchaseValidationError("파일 크기는 10MB 이하여야 합니다.");
  }

  const allowedTypes = Object.keys(VENDOR_DOCUMENT_FILE_TYPES);
  const extension = getFileExtension(file.name);
  const allowedExtensions = Object.values(VENDOR_DOCUMENT_FILE_TYPES).flat();

  if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
    throw new PurchaseValidationError(
      "PDF, JPG, PNG, WEBP 파일만 업로드할 수 있습니다."
    );
  }
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex >= 0 ? filename.slice(lastDotIndex).toLowerCase() : "";
}
