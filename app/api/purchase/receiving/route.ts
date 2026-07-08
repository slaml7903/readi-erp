import { NextResponse } from "next/server";

import {
  PurchaseReceivingValidationError,
  submitPurchaseReceiving,
} from "@/features/purchase/services/receiving.service";
import type { SubmitPurchaseReceivingInput } from "@/features/purchase/types/purchase.type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitPurchaseReceivingInput;
    const receiving = await submitPurchaseReceiving(body);

    return NextResponse.json({
      receivingId: receiving.id,
      message: "입고확인이 제출되었습니다. 발주 상태는 변경되지 않았습니다.",
    });
  } catch (error) {
    if (error instanceof PurchaseReceivingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { message: "입고확인 제출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
