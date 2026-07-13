import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { fetchPurchaseVendors } from "@/features/purchase/services/purchase.service";

export async function GET() {
  try {
    const vendors = await fetchPurchaseVendors();

    return NextResponse.json({
      vendors,
    });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-vendors-api",
      fallbackMessage: "거래처 목록 조회 중 오류가 발생했습니다.",
    });
  }
}
