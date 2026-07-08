import { NextResponse } from "next/server";

import {
  approvePurchaseReceivingReview,
  PurchaseReceivingValidationError,
} from "@/features/purchase/services/receiving.service";

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
    if (error instanceof PurchaseReceivingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("이미 검토완료")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error(error);

    return NextResponse.json(
      { message: "검토완료 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
