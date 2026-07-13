import { NextResponse } from "next/server";

import {
  AirtableRepositoryError,
  logAirtableRepositoryError,
} from "@/lib/airtable/errors/airtable-repository.error";

import { PurchaseValidationError } from "../errors/purchase-validation.error";

type PurchaseApiErrorOptions = {
  scope: string;
  fallbackMessage: string;
};

export function createPurchaseApiErrorResponse(
  error: unknown,
  { scope, fallbackMessage }: PurchaseApiErrorOptions
) {
  if (error instanceof PurchaseValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (error instanceof AirtableRepositoryError) {
    logAirtableRepositoryError(scope, error);

    return NextResponse.json(
      { message: "데이터 저장 중 외부 데이터베이스 오류가 발생했습니다." },
      { status: 502 }
    );
  }

  console.error({
    scope,
    message: error instanceof Error ? error.message : "Unknown error",
  });

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
