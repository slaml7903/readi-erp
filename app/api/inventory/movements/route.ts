import { NextResponse } from "next/server";

import { createInventoryApiErrorResponse } from "@/features/inventory/api/inventory-api-error";
import {
  fetchInventoryItems,
  fetchInventoryMovements,
  submitInventoryMovement,
} from "@/features/inventory/services/inventory.service";
import type { CreateInventoryMovementInput } from "@/features/inventory/types/inventory.type";

export async function GET() {
  try {
    const [items, movements] = await Promise.all([
      fetchInventoryItems({ fresh: true }),
      fetchInventoryMovements({ fresh: true }),
    ]);
    return NextResponse.json({ items, movements });
  } catch (error) {
    return createInventoryApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Partial<CreateInventoryMovementInput>;
    const movement = await submitInventoryMovement(input);

    return NextResponse.json(
      { id: movement.id, message: "재고변동이 등록되었습니다." },
      { status: 201 }
    );
  } catch (error) {
    return createInventoryApiErrorResponse(error);
  }
}

