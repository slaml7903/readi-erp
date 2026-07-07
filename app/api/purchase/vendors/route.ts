import { NextResponse } from "next/server";

import { fetchPurchaseVendors } from "@/features/purchase/services/purchase.service";

export async function GET() {
  try {
    const vendors = await fetchPurchaseVendors();

    return NextResponse.json({
      vendors,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "거래처 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}