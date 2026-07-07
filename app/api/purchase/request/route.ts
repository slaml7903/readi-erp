import { NextResponse } from "next/server";

import { submitPurchaseRequest } from "@/features/purchase/services/purchase.service";
import type { CreatePurchaseRequestInput } from "@/features/purchase/types/purchase.type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseRequestInput;

    if (!body.title) {
      return NextResponse.json(
        { message: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    if (!body.teamName) {
      return NextResponse.json(
        { message: "팀명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!body.requester) {
      return NextResponse.json(
        { message: "요청자는 필수입니다." },
        { status: 400 }
      );
    }

    if (!body.orders || body.orders.length === 0) {
      return NextResponse.json(
        { message: "발주는 최소 1개 이상 필요합니다." },
        { status: 400 }
      );
    }

    for (let orderIndex = 0; orderIndex < body.orders.length; orderIndex += 1) {
      const order = body.orders[orderIndex];

      const isNewVendor = order.vendorName && !order.vendorRecordId;

      if (isNewVendor) {
        if (!order.newVendorDocuments?.businessLicenseUrl) {
          return NextResponse.json(
            {
              message: `${
                orderIndex + 1
              }번째 발주의 신규 거래처 사업자등록증 URL을 입력해주세요.`,
            },
            { status: 400 }
          );
        }

        if (!order.newVendorDocuments?.bankbookUrl) {
          return NextResponse.json(
            {
              message: `${
                orderIndex + 1
              }번째 발주의 신규 거래처 통장사본 URL을 입력해주세요.`,
            },
            { status: 400 }
          );
        }
      }

      if (!order.items || order.items.length === 0) {
        return NextResponse.json(
          {
            message: `${orderIndex + 1}번째 발주에 발주상세품목이 없습니다.`,
          },
          { status: 400 }
        );
      }

      for (
        let itemIndex = 0;
        itemIndex < order.items.length;
        itemIndex += 1
      ) {
        const item = order.items[itemIndex];

        if (!item.modelName) {
          return NextResponse.json(
            {
              message: `${orderIndex + 1}번째 발주의 ${
                itemIndex + 1
              }번째 품목 모델명은 필수입니다.`,
            },
            { status: 400 }
          );
        }

        if (item.quantity <= 0) {
          return NextResponse.json(
            {
              message: `${orderIndex + 1}번째 발주의 ${
                itemIndex + 1
              }번째 품목 수량을 확인해주세요.`,
            },
            { status: 400 }
          );
        }

        if (item.unitPrice < 0) {
          return NextResponse.json(
            {
              message: `${orderIndex + 1}번째 발주의 ${
                itemIndex + 1
              }번째 품목 단가를 확인해주세요.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const result = await submitPurchaseRequest(body);

    return NextResponse.json({
      requestId: result.request.id,
      orderCount: result.orders.length,
      itemCount: result.orders.reduce(
        (total, order) => total + order.items.length,
        0
      ),
      message: "구매요청, 발주, 발주상세품목이 등록되었습니다.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "구매요청 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}