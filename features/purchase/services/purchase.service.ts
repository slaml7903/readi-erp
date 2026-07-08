import {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseVendors,
} from "../repository/purchase.repository";

import type { CreatePurchaseRequestInput } from "../types/purchase.type";

export class PurchaseRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseRequestValidationError";
  }
}

export async function fetchPurchaseRequests() {
  return await getPurchaseRequests();
}

export async function submitPurchaseRequest(
  input: CreatePurchaseRequestInput
) {
  validatePurchaseRequestInput(input);

  return await createPurchaseRequest(input);
}

export async function fetchPurchaseVendors() {
  return await getPurchaseVendors();
}

function validatePurchaseRequestInput(input: CreatePurchaseRequestInput) {
  if (!input.title) {
    throw new PurchaseRequestValidationError("제목은 필수입니다.");
  }

  if (!input.teamName) {
    throw new PurchaseRequestValidationError("팀명은 필수입니다.");
  }

  if (!input.requester) {
    throw new PurchaseRequestValidationError("요청자는 필수입니다.");
  }

  if (!input.orders || input.orders.length === 0) {
    throw new PurchaseRequestValidationError("발주는 최소 1개 이상 필요합니다.");
  }

  input.orders.forEach((order, orderIndex) => {
    const orderNumber = orderIndex + 1;
    const isNewVendor = order.vendorName && !order.vendorRecordId;

    if (isNewVendor) {
      if (!order.newVendorDocuments?.businessLicenseFile) {
        throw new PurchaseRequestValidationError(
          `${orderNumber}번째 발주의 신규 거래처 사업자등록증 파일을 첨부해주세요.`
        );
      }

      if (!order.newVendorDocuments?.bankbookFile) {
        throw new PurchaseRequestValidationError(
          `${orderNumber}번째 발주의 신규 거래처 통장사본 파일을 첨부해주세요.`
        );
      }
    }

    if (!order.items || order.items.length === 0) {
      throw new PurchaseRequestValidationError(
        `${orderNumber}번째 발주에 발주상세항목이 없습니다.`
      );
    }

    order.items.forEach((item, itemIndex) => {
      const itemNumber = itemIndex + 1;

      if (!item.modelName) {
        throw new PurchaseRequestValidationError(
          `${orderNumber}번째 발주의 ${itemNumber}번째 항목 모델명은 필수입니다.`
        );
      }

      if (item.quantity <= 0) {
        throw new PurchaseRequestValidationError(
          `${orderNumber}번째 발주의 ${itemNumber}번째 항목 수량을 확인해주세요.`
        );
      }

      if (item.unitPrice < 0) {
        throw new PurchaseRequestValidationError(
          `${orderNumber}번째 발주의 ${itemNumber}번째 항목 단가를 확인해주세요.`
        );
      }
    });
  });
}
