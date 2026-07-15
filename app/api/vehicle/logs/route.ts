import { NextResponse } from "next/server";

import {
  fetchVehicleLogs,
  normalizeVehicleLogFilters,
} from "@/features/vehicle/services/vehicle.service";
import { VehicleApiError } from "@/features/vehicle/repository/vehicle.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = normalizeVehicleLogFilters({
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      vehicleNumber: searchParams.get("carNo") ?? undefined,
      department: searchParams.get("dept") ?? undefined,
      driverName: searchParams.get("driverName") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    const data = await fetchVehicleLogs(filters);

    return NextResponse.json({ ...data, filters });
  } catch (error) {
    if (error instanceof VehicleApiError) {
      return NextResponse.json({ message: error.message }, { status: 502 });
    }

    console.error({
      scope: "vehicle-logs-api",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { message: "운행기록을 조회하지 못했습니다." },
      { status: 500 }
    );
  }
}
