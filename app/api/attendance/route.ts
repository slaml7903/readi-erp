import { NextResponse } from "next/server";

import {
  AirtableRepositoryError,
  logAirtableRepositoryError,
} from "@/lib/airtable/errors/airtable-repository.error";
import {
  AttendanceRequestValidationError,
  fetchAttendanceDashboard,
  submitAttendanceRequest,
} from "@/features/attendance/services/attendance.service";
import type { CreateAttendanceRequestInput } from "@/features/attendance/types/attendance.type";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await fetchAttendanceDashboard({
      month: searchParams.get("month") ?? "",
      department: searchParams.get("department") ?? "",
      type: searchParams.get("type") ?? "",
      employee: searchParams.get("employee") ?? "",
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AirtableRepositoryError) {
      logAirtableRepositoryError("attendance-api", error);

      return NextResponse.json(
        { message: "근태관리 데이터를 조회하는 중 외부 데이터베이스 오류가 발생했습니다." },
        { status: 502 }
      );
    }

    console.error({
      scope: "attendance-api",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "근태관리 데이터를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAttendanceRequestInput;
    const record = await submitAttendanceRequest(body);

    return NextResponse.json({
      id: record.id,
      message: "근태 신청이 등록되었습니다.",
    });
  } catch (error) {
    if (error instanceof AttendanceRequestValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof AirtableRepositoryError) {
      logAirtableRepositoryError("attendance-request-api", error);

      return NextResponse.json(
        { message: "근태 신청 등록 중 외부 데이터베이스 오류가 발생했습니다." },
        { status: 502 }
      );
    }

    console.error({
      scope: "attendance-request-api",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "근태 신청 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
