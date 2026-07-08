import { NextResponse } from "next/server";

import {
  PurchaseRequestValidationError,
  submitPurchaseRequest,
} from "@/features/purchase/services/purchase.service";
import type { CreatePurchaseRequestInput } from "@/features/purchase/types/purchase.type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseRequestInput;
    const result = await submitPurchaseRequest(body);

    return NextResponse.json({
      requestId: result.request.id,
      orderCount: result.orders.length,
      itemCount: result.orders.reduce(
        (total, order) => total + order.items.length,
        0
      ),
      message: "구매요청, 발주, 발주상세항목이 등록되었습니다.",
    });
  } catch (error) {
    if (error instanceof PurchaseRequestValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { message: "구매요청 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
