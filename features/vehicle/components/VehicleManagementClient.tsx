"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";

import type {
  VehicleLogData,
  VehicleLogFilters,
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
  const body = (await response.json()) as VehicleLogData | { message?: string };

  if (!response.ok) {
    throw new Error(
      "message" in body && body.message
        ? body.message
        : "운행기록을 조회하지 못했습니다."
    );
  }

  return body as VehicleLogData;
}

export default function VehicleManagementClient({ data }: { data: VehiclePageData }) {
  const router = useRouter();
  const [logData, setLogData] = useState(data.logData);
  const [filters, setFilters] = useState(data.filters);
  const [filterApplied, setFilterApplied] = useState(data.filterApplied);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLogs(nextFilters: VehicleLogFilters, applied: boolean) {
    setLoading(true);
    setError("");

    try {
      const nextLogData = await requestVehicleLogs(nextFilters);
      setLogData(nextLogData);
      setFilters(nextFilters);
      setFilterApplied(applied);
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
    if (filterApplied) params.set("filtered", "1");
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
          <h2 className="text-lg font-semibold text-gray-900">운행기록</h2>
          <p className="text-sm text-gray-500">
            {filterApplied ? "검색 결과 최대 20건" : "최근 운행기록 20건"}
            {` · 현재 ${logData.logs.length.toLocaleString("ko-KR")}건`}
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
          disabled={loading}
          onApply={(nextFilters) => void loadLogs(nextFilters, true)}
          onReset={() => void loadLogs(data.defaultFilters, false)}
        />
        <VehicleLogTable logs={logData.logs} />
      </section>
    </div>
  );
}
