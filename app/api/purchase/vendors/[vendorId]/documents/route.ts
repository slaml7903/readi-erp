import { NextResponse } from "next/server";

import { createPurchaseApiErrorResponse } from "@/features/purchase/api/purchase-api-error";
import { submitVendorDocument } from "@/features/purchase/services/vendor.service";
import {
  parseVendorDocumentType,
  validateVendorDocumentFile,
} from "@/features/purchase/validation/vendor.validation";
import { PurchaseValidationError } from "@/features/purchase/errors/purchase-validation.error";

type RouteContext = {
  params: Promise<{ vendorId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { vendorId } = await params;
    const formData = await request.formData();
    const documentTypeValue = formData.get("documentType");
    const fileValue = formData.get("file");

    if (typeof documentTypeValue !== "string") {
      throw new PurchaseValidationError("서류 유형을 선택해 주세요.");
    }

    if (!(fileValue instanceof File)) {
      throw new PurchaseValidationError("업로드할 파일을 선택해 주세요.");
    }

    const documentType = parseVendorDocumentType(documentTypeValue);
    validateVendorDocumentFile(fileValue);

    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());
    const document = await submitVendorDocument({
      vendorRecordId: vendorId,
      documentType,
      file: {
        filename: fileValue.name,
        contentType: fileValue.type,
        file: fileBuffer.toString("base64"),
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return createPurchaseApiErrorResponse(error, {
      scope: "purchase-vendor-document-create-api",
      fallbackMessage: "거래처 서류 업로드 중 오류가 발생했습니다.",
    });
  }
}
