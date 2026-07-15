import { PageHeader } from "@/components/ui";
import VehicleManagementClient from "@/features/vehicle/components/VehicleManagementClient";
import {
  fetchVehicleDashboard,
  fetchVehicleLogs,
  getDefaultVehicleLogFilters,
  normalizeVehicleLogFilters,
} from "@/features/vehicle/services/vehicle.service";

type VehiclePageProps = {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    carNo?: string;
    dept?: string;
    driverName?: string;
    status?: string;
    refresh?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function VehiclePage({ searchParams }: VehiclePageProps) {
  const params = await searchParams;
  const filters = normalizeVehicleLogFilters({
    startDate: params.startDate,
    endDate: params.endDate,
    vehicleNumber: params.carNo,
    department: params.dept,
    driverName: params.driverName,
    status: params.status,
  });
  const forceRefresh = Boolean(params.refresh);
  const defaultFilters = getDefaultVehicleLogFilters();
  const [dashboard, logData] = await Promise.all([
    fetchVehicleDashboard(forceRefresh),
    fetchVehicleLogs(filters, forceRefresh),
  ]);

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="법인차량 운행관리"
        description="Google 차량 운행일지의 현황과 운행기록을 조회합니다."
      />
      <VehicleManagementClient
        key={params.refresh ?? "initial"}
        data={{ dashboard, logData, filters, defaultFilters }}
      />
    </div>
  );
}
