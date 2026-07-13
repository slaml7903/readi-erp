import type { CreatePurchaseOrderInput } from "../types/purchase.type";
import { calculatePurchaseAmount } from "../domain/purchase-amount";
import { normalizePurchaseNumber } from "../utils/purchase-number";
import { assertAirtableRecordId } from "./purchase-linked-record.validation";
import {
  assertNonEmptyArray,
  assertNonNegativeNumber,
  assertPositiveNumber,
  assertRequiredString,
} from "./purchase-validation.helpers";

export function validateCreatePurchaseOrderInput(
  order: CreatePurchaseOrderInput,
  orderIndex: number
) {
  const orderNumber = orderIndex + 1;
  const isNewVendor = order.vendorName && !order.vendorRecordId;

  if (!order.vendorRecordId && !order.vendorName) {
    assertRequiredString("", `${orderNumber}번째 발주의 공급처를 선택해주세요.`);
  }

  if (order.vendorRecordId) {
    assertAirtableRecordId(
      order.vendorRecordId,
      `${orderNumber}번째 발주의 공급처 ID`
    );
  }

  assertRequiredString(
    order.orderDate,
    `${orderNumber}번째 발주의 발주일은 필수입니다.`
  );

  if (isNewVendor) {
    if (!order.newVendorDocuments?.businessLicenseFile) {
      assertRequiredString(
        "",
        `${orderNumber}번째 발주의 신규 거래처 사업자등록증 파일을 첨부해주세요.`
      );
    }

    if (!order.newVendorDocuments?.bankbookFile) {
      assertRequiredString(
        "",
        `${orderNumber}번째 발주의 신규 거래처 통장사본 파일을 첨부해주세요.`
      );
    }
  }

  assertNonEmptyArray(
    order.items,
    `${orderNumber}번째 발주에 발주상세항목이 없습니다.`
  );

  order.items.forEach((item, itemIndex) => {
    const itemNumber = itemIndex + 1;

    assertRequiredString(
      item.modelName,
      `${orderNumber}번째 발주의 ${itemNumber}번째 항목 모델명은 필수입니다.`
    );
    assertPositiveNumber(
      item.quantity,
      `${orderNumber}번째 발주의 ${itemNumber}번째 항목 수량을 확인해주세요.`
    );
    assertNonNegativeNumber(
      item.unitPrice,
      `${orderNumber}번째 발주의 ${itemNumber}번째 항목 단가를 확인해주세요.`
    );
  });
}

export function normalizeCreatePurchaseOrderInput(
  order: CreatePurchaseOrderInput,
  orderIndex: number
): CreatePurchaseOrderInput {
  return {
    ...order,
    items: order.items.map((item, itemIndex) => {
      const orderNumber = orderIndex + 1;
      const itemNumber = itemIndex + 1;
      const quantity = normalizePurchaseNumber(item.quantity, {
        fieldName: `${orderNumber}번째 발주의 ${itemNumber}번째 항목 수량`,
      });
      const unitPrice = normalizePurchaseNumber(item.unitPrice, {
        allowZero: true,
        fieldName: `${orderNumber}번째 발주의 ${itemNumber}번째 항목 단가`,
      });

      calculatePurchaseAmount({
        quantity,
        unitPrice,
        vatIncluded: item.vatIncluded,
      });

      return {
        ...item,
        modelName: item.modelName.trim(),
        quantity,
        unitPrice,
        memo: item.memo?.trim() || undefined,
      };
    }),
  };
}
