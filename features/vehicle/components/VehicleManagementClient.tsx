"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";

import type {
  VehicleLogFilters,
  VehicleLogQueryResult,
  VehiclePageData,
} from "../types/vehicle.type";
import VehicleLogFiltersForm from "./VehicleLogFilters";
import VehicleLogTable from "./VehicleLogTable";
import VehicleStatusSummary from "./VehicleStatusSummary";
import VehicleStatusTable from "./VehicleStatusTable";

function createVehicleQuery(filters: VehicleLogFilters) {
  const params = new URLSearchParams();
  params.set("startDate", filters.startDate);
  params.set("endDate", filters.endDate);
  if (filters.vehicleNumber) params.set("carNo", filters.vehicleNumber);
  if (filters.department) params.set("dept", filters.department);
  if (filters.driverName) params.set("driverName", filters.driverName);
  if (filters.status) params.set("status", filters.status);
  return params;
}

async function requestVehicleLogs(filters: VehicleLogFilters) {
  const response = await fetch(
    `/api/vehicle/logs?${createVehicleQuery(filters).toString()}`
  );
  const body = (await response.json()) as
    | VehicleLogQueryResult
    | { message?: string };

  if (!response.ok) {
    throw new Error(
      "message" in body && body.message
        ? body.message
        : "운행기록을 조회하지 못했습니다."
    );
  }

  return body as VehicleLogQueryResult;
}

export default function VehicleManagementClient({ data }: { data: VehiclePageData }) {
  const router = useRouter();
  const [logData, setLogData] = useState(data.logData);
  const [filters, setFilters] = useState(data.filters);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const visibleLogs = logData.logs.slice(0, visibleCount);
  const displayedCount = visibleLogs.length;
  const remainingCount = Math.max(logData.logs.length - displayedCount, 0);

  async function loadLogs(nextFilters: VehicleLogFilters) {
    setLoading(true);
    setError("");

    try {
      const nextLogData = await requestVehicleLogs(nextFilters);
      setLogData(nextLogData);
      setFilters(nextLogData.filters);
      setVisibleCount(10);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "운행기록을 조회하지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    const params = createVehicleQuery(filters);
    params.set("refresh", String(Date.now()));
    router.push(`/vehicle?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "조회 중..." : "새로고침"}
        </Button>
      </div>

      <VehicleStatusSummary summary={data.dashboard.summary} />

      <section className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">차량 현황</h2>
          <p className="text-sm text-gray-500">
            Apps Script에서 계산한 현재 차량 상태입니다.
          </p>
        </div>
        <VehicleStatusTable vehicles={data.dashboard.vehicles} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            최근 1개월 운행기록
          </h2>
          <p className="text-sm text-gray-500">
            최대 최근 1개월의 운행기록을 조회합니다.
          </p>
          <p className="mt-1 text-sm font-medium text-gray-700">
            총 {logData.logs.length.toLocaleString("ko-KR")}건 중{" "}
            {displayedCount.toLocaleString("ko-KR")}건 표시
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <VehicleLogFiltersForm
          filters={filters}
          vehicles={data.dashboard.vehicles}
          departments={logData.departments}
          minDate={data.defaultFilters.startDate}
          maxDate={data.defaultFilters.endDate}
          disabled={loading}
          onApply={(nextFilters) => void loadLogs(nextFilters)}
          onReset={() => void loadLogs(data.defaultFilters)}
        />
        <VehicleLogTable logs={visibleLogs} />

        {visibleCount < logData.logs.length && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((count) => count + 10)}
            >
              더보기 (남은 {remainingCount.toLocaleString("ko-KR")}건)
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
