import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { approvePurchaseReceivingReview } from "@/features/purchase/services/receiving.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ receivingId: string }> }
) {
  try {
    const { receivingId } = await params;
    const result = await approvePurchaseReceivingReview(receivingId);

    return NextResponse.json({
      receivingId: result.receiving.id,
      orderId: result.order.id,
      message: "검토완료 처리되었고 발주 상태가 입고완료로 변경되었습니다.",
    });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-receiving-review-api",
      fallbackMessage: "검토완료 처리 중 오류가 발생했습니다.",
    });
  }
}
