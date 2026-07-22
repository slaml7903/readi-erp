import { NextResponse } from "next/server";

import {
  AirtableRepositoryError,
  logAirtableRepositoryError,
} from "@/lib/airtable/errors/airtable-repository.error";

import { InventoryValidationError } from "../validation/inventory-movement.validation";

export function createInventoryApiErrorResponse(error: unknown) {
  if (error instanceof InventoryValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (error instanceof AirtableRepositoryError) {
    logAirtableRepositoryError("inventory-api", error);
    return NextResponse.json(
      { message: "재고 데이터 처리 중 외부 데이터베이스 오류가 발생했습니다." },
      { status: 502 }
    );
  }

  console.error({
    scope: "inventory-api",
    message: error instanceof Error ? error.message : "Unknown error",
  });
  return NextResponse.json(
    { message: "재고 데이터를 처리하지 못했습니다." },
    { status: 500 }
  );
}

