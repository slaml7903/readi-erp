import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { fetchPurchaseVendors } from "@/features/purchase/services/purchase.service";
import {
  DuplicateVendorNameWarning,
  submitVendor,
} from "@/features/purchase/services/vendor.service";
import type { CreateVendorInput } from "@/features/purchase/types/vendor.type";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateVendorInput> & {
      allowDuplicateName?: boolean;
    };
    const vendor = await submitVendor(
      {
        name: body.name ?? "",
        manager: body.manager,
        email: body.email,
        phone: body.phone,
        handledItems: body.handledItems,
        memo: body.memo,
      },
      { allowDuplicateName: body.allowDuplicateName === true }
    );

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateVendorNameWarning) {
      return NextResponse.json(
        {
          code: "DUPLICATE_VENDOR_NAME",
          message: error.message,
          existingVendorId: error.existingVendorId,
        },
        { status: 409 }
      );
    }

    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-vendors-create-api",
      fallbackMessage: "거래처 등록 중 오류가 발생했습니다.",
    });
  }
}
