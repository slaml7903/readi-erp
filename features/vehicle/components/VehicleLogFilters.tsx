"use client";

import { Button, Input, Select } from "@/components/ui";

import type {
  VehicleLogFilters as VehicleLogFiltersType,
  VehicleStatusItem,
} from "../types/vehicle.type";

const LOG_STATUSES = ["운행중", "장기운행중", "완료"];

export default function VehicleLogFilters({
  filters,
  vehicles,
  departments,
  minDate,
  maxDate,
  disabled,
  onApply,
  onReset,
}: {
  filters: VehicleLogFiltersType;
  vehicles: VehicleStatusItem[];
  departments: string[];
  minDate: string;
  maxDate: string;
  disabled: boolean;
  onApply: (filters: VehicleLogFiltersType) => void;
  onReset: () => void;
}) {
  return (
    <form
      key={JSON.stringify(filters)}
      className="grid gap-3 rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)] lg:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onApply({
          startDate: String(formData.get("startDate") ?? ""),
          endDate: String(formData.get("endDate") ?? ""),
          vehicleNumber: String(formData.get("vehicleNumber") ?? ""),
          department: String(formData.get("department") ?? ""),
          driverName: String(formData.get("driverName") ?? ""),
          status: String(formData.get("status") ?? ""),
        });
      }}
    >
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>시작일</span>
        <Input
          required
          name="startDate"
          type="date"
          min={minDate}
          max={maxDate}
          defaultValue={filters.startDate}
          className="w-full"
        />
      </label>
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>종료일</span>
        <Input
          required
          name="endDate"
          type="date"
          min={minDate}
          max={maxDate}
          defaultValue={filters.endDate}
          className="w-full"
        />
      </label>
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>차량</span>
        <Select name="vehicleNumber" defaultValue={filters.vehicleNumber} className="w-full bg-white">
          <option value="">전체</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.vehicleNumber} value={vehicle.vehicleNumber}>
              {vehicle.vehicleNumber} {vehicle.vehicleName ? `· ${vehicle.vehicleName}` : ""}
            </option>
          ))}
        </Select>
      </label>
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>부서</span>
        <Select name="department" defaultValue={filters.department} className="w-full bg-white">
          <option value="">전체</option>
          {departments.map((department) => (
            <option key={department} value={department}>{department}</option>
          ))}
        </Select>
      </label>
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>운전자</span>
        <Input name="driverName" defaultValue={filters.driverName} className="w-full" placeholder="이름 검색" />
      </label>
      <label className="space-y-1 text-xs font-medium text-gray-600">
        <span>상태</span>
        <Select name="status" defaultValue={filters.status} className="w-full bg-white">
          <option value="">전체</option>
          {LOG_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </Select>
      </label>
      <div className="flex gap-2 lg:col-span-6 lg:justify-end">
        <Button type="button" variant="outline" onClick={onReset} disabled={disabled}>초기화</Button>
        <Button type="submit" disabled={disabled}>조회</Button>
      </div>
    </form>
  );
}
