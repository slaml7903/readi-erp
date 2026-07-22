import type { SubmitPurchaseReceivingInput } from "../types/purchase.type";
import { assertRequiredString } from "./purchase-validation.helpers";

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_FIELD = 10;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateReceivingOrderId(orderRecordId: string) {
  assertRequiredString(orderRecordId, "발주 ID가 필요합니다.");
}

export function validateReceivingReviewId(receivingRecordId: string) {
  assertRequiredString(receivingRecordId, "입고확인 ID가 필요합니다.");
}

export function validateReceivingInput(input: SubmitPurchaseReceivingInput) {
  assertRequiredString(input.requestRecordId, "구매요청을 선택해주세요.");
  validateReceivingOrderId(input.orderRecordId);

  if (!Array.isArray(input.orderItemRecordIds) || input.orderItemRecordIds.length === 0) {
    assertRequiredString("", "입고 처리할 발주상세품목을 하나 이상 선택해주세요.");
  }

  if (new Set(input.orderItemRecordIds).size !== input.orderItemRecordIds.length) {
    assertRequiredString("", "중복된 발주상세품목이 포함되어 있습니다.");
  }

  assertRequiredString(input.receivingChecker, "입고확인자를 입력해주세요.");
  assertRequiredString(input.receivingDate, "입고확인일을 입력해주세요.");

  if (!isValidDateOnly(input.receivingDate)) {
    assertRequiredString("", "입고확인일은 유효한 YYYY-MM-DD 날짜여야 합니다.");
  }

  validateAttachments(input.transactionStatementFiles, "거래명세서");
  validateAttachments(input.receivingEvidenceFiles, "입고증빙");
}

export function normalizeReceivingInput(
  input: Partial<SubmitPurchaseReceivingInput> | null | undefined
): SubmitPurchaseReceivingInput {
  const source = input ?? {};

  return {
    requestRecordId:
      typeof source.requestRecordId === "string" ? source.requestRecordId.trim() : "",
    orderRecordId:
      typeof source.orderRecordId === "string" ? source.orderRecordId.trim() : "",
    orderItemRecordIds: Array.isArray(source.orderItemRecordIds)
      ? source.orderItemRecordIds
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
      : [],
    receivingChecker:
      typeof source.receivingChecker === "string" ? source.receivingChecker.trim() : "",
    receivingDate:
      typeof source.receivingDate === "string" ? source.receivingDate.trim() : "",
    memo: typeof source.memo === "string" ? source.memo.trim() || undefined : undefined,
    transactionStatementFiles: Array.isArray(source.transactionStatementFiles)
      ? source.transactionStatementFiles
      : [],
    receivingEvidenceFiles: Array.isArray(source.receivingEvidenceFiles)
      ? source.receivingEvidenceFiles
      : [],
  };
}

function isValidDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateAttachments(
  files: SubmitPurchaseReceivingInput["transactionStatementFiles"],
  label: string
) {
  if (!Array.isArray(files) || files.length === 0) {
    assertRequiredString("", `${label}를 하나 이상 첨부해주세요.`);
  }

  if (files.length > MAX_ATTACHMENTS_PER_FIELD) {
    assertRequiredString(
      "",
      `${label}는 최대 ${MAX_ATTACHMENTS_PER_FIELD}개까지 첨부할 수 있습니다.`
    );
  }

  files.forEach((file, index) => {
    const fileLabel = `${label} ${index + 1}번째 파일`;
    assertRequiredString(file?.filename, `${fileLabel} 이름이 없습니다.`);
    assertRequiredString(file?.contentType, `${fileLabel} 형식을 확인할 수 없습니다.`);
    assertRequiredString(file?.file, `${fileLabel}이 비어 있습니다.`);

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.contentType)) {
      assertRequiredString(
        "",
        `${fileLabel}은 PDF, JPG, PNG, WEBP 형식만 업로드할 수 있습니다.`
      );
    }

    const extension = file.filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
    const allowedExtensions: Record<string, string[]> = {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    };
    if (!extension || !allowedExtensions[file.contentType]?.includes(extension)) {
      assertRequiredString("", `${fileLabel}의 확장자와 파일 형식이 일치하지 않습니다.`);
    }

    const size = getBase64ByteSize(file.file);
    if (size <= 0) {
      assertRequiredString("", `${fileLabel}이 비어 있습니다.`);
    }
    if (size > MAX_ATTACHMENT_SIZE_BYTES) {
      assertRequiredString("", `${fileLabel}은 5MB를 초과할 수 없습니다.`);
    }
  });
}

function getBase64ByteSize(value: string) {
  const base64 = value.trim();
  if (
    base64.length === 0 ||
    base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  ) {
    assertRequiredString("", "첨부파일 데이터 형식이 올바르지 않습니다.");
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}
