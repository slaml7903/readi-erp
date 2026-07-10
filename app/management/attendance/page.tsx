import { PageHeader } from "@/components/ui";
import AttendanceCalendarClient from "@/features/attendance/components/AttendanceCalendarClient";
import { fetchAttendanceDashboard } from "@/features/attendance/services/attendance.service";

type AttendancePageProps = {
  searchParams: Promise<{
    month?: string;
    department?: string;
    type?: string;
    employee?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const params = await searchParams;
  const data = await fetchAttendanceDashboard({
    month: params.month ?? "",
    department: params.department ?? "",
    type: params.type ?? "",
    employee: params.employee ?? "",
  });

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="근태관리"
        description="월간 캘린더로 전사 근무 상태를 확인합니다."
      />

      <AttendanceCalendarClient
        data={data}
        selectedMonth={data.month}
        department={params.department ?? ""}
        type={params.type ?? ""}
        employee={params.employee ?? ""}
      />
    </div>
  );
}
