import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { approvePurchaseReceivingReview } from "@/features/purchase/services/receiving.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ receivingId: string }> }
) {
  try {
    const { receivingId } = await params;
    const receiving = await approvePurchaseReceivingReview(receivingId);

    return NextResponse.json({
      receivingId: receiving.id,
      message: "검토완료 처리되었습니다. 품목과 발주 상태는 Airtable에서 자동 반영됩니다.",
    });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-receiving-review-api",
      fallbackMessage: "검토완료 처리 중 오류가 발생했습니다.",
    });
  }
}
