import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import {
  DuplicateVendorNameWarning,
  fetchVendorDetail,
  submitVendorUpdate,
} from "@/features/purchase/services/vendor.service";
import type { CreateVendorInput } from "@/features/purchase/types/vendor.type";

type RouteContext = {
  params: Promise<{ vendorId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { vendorId } = await params;
    const vendor = await fetchVendorDetail(vendorId);

    return NextResponse.json({ vendor });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-vendor-detail-api",
      fallbackMessage: "거래처 상세정보 조회 중 오류가 발생했습니다.",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { vendorId } = await params;
    const body = (await request.json()) as Partial<CreateVendorInput> & {
      allowDuplicateName?: boolean;
    };
    const vendor = await submitVendorUpdate(
      vendorId,
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

    return NextResponse.json({ vendor });
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
      scope: "purchase-vendor-update-api",
      fallbackMessage: "거래처 정보 수정 중 오류가 발생했습니다.",
    });
  }
}
