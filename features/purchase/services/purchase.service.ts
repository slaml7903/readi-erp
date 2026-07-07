import {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseVendors,
} from "../repository/purchase.repository";

import type { CreatePurchaseRequestInput } from "../types/purchase.type";

export async function fetchPurchaseRequests() {
  return await getPurchaseRequests();
}

export async function submitPurchaseRequest(
  input: CreatePurchaseRequestInput
) {
  return await createPurchaseRequest(input);
}

export async function fetchPurchaseVendors() {
  return await getPurchaseVendors();
}