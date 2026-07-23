import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { PurchaseValidationError } from "@/features/purchase/errors/purchase-validation.error";
import { changeExpenseCompleted } from "@/features/purchase/services/expense.service";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { orderId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const keys = Object.keys(body);

    if (
      keys.length !== 1 ||
      keys[0] !== "expenseCompleted" ||
      typeof body.expenseCompleted !== "boolean"
    ) {
      throw new PurchaseValidationError(
        "지출완료 상태만 변경할 수 있습니다."
      );
    }

    const order = await changeExpenseCompleted(
      orderId,
      body.expenseCompleted
    );

    return NextResponse.json({ order });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-expense-update-api",
      fallbackMessage: "지출 상태 변경 중 오류가 발생했습니다.",
    });
  }
}
