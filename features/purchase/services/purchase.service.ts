import {
  createPurchaseRequest,
  getPurchaseRequests,
  getVendorById,
  getPurchaseVendors,
} from "../repository/purchase.repository";
import { PurchaseValidationError } from "../errors/purchase-validation.error";
import {
  normalizePurchaseRequestInput,
  validatePurchaseRequestInput,
} from "../validation/purchase-request.validation";

import type { CreatePurchaseRequestInput } from "../types/purchase.type";

export { PurchaseValidationError as PurchaseRequestValidationError };

export async function fetchPurchaseRequests() {
  return await getPurchaseRequests();
}

export async function submitPurchaseRequest(
  input: CreatePurchaseRequestInput
) {
  const normalizedInput = normalizePurchaseRequestInput(input);

  validatePurchaseRequestInput(normalizedInput);
  await validateLinkedPurchaseRequestRecords(normalizedInput);

  return await createPurchaseRequest(normalizedInput);
}

export async function fetchPurchaseVendors() {
  return await getPurchaseVendors();
}

async function validateLinkedPurchaseRequestRecords(
  input: CreatePurchaseRequestInput
) {
  const vendorRecordIds = Array.from(
    new Set(
      input.orders
        .map((order) => order.vendorRecordId)
        .filter((vendorRecordId): vendorRecordId is string =>
          Boolean(vendorRecordId)
        )
    )
  );

  for (const vendorRecordId of vendorRecordIds) {
    const vendor = await getVendorById(vendorRecordId);

    if (!vendor) {
      throw new PurchaseValidationError("공급처 정보를 찾을 수 없습니다.");
    }
  }
}
