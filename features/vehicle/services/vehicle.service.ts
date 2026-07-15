import "server-only";

import { getTodayDate } from "@/lib/date";

import {
  getVehicleDashboardFromApi,
  getVehicleLogsFromApi,
  type AppsScriptVehicle,
  type AppsScriptVehicleLog,
} from "../repository/vehicle.repository";
import type {
  VehicleDashboard,
  VehicleDrivingLog,
  VehicleLogData,
  VehicleLogFilters,
  VehicleStatusItem,
  VehicleSummary,
} from "../types/vehicle.type";

function toStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toNullableString(value: unknown) {
  const normalized = toStringValue(value);
  return normalized || null;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDepartments(values: unknown[] | undefined) {
  if (!values) return [];

  return [
    ...new Set(values.map(toStringValue).filter((value) => value.length > 0)),
  ];
}

function normalizeVehicle(vehicle: AppsScriptVehicle): VehicleStatusItem {
  const runningLog = vehicle.runningLog;
  const activeLog = runningLog
    ? {
        rowNumber: toNullableNumber(runningLog.rowNumber) ?? 0,
        startedAt: toNullableString(runningLog.startTime),
        department: toStringValue(runningLog.dept),
        driverName: toStringValue(runningLog.name),
        destination: toStringValue(runningLog.destination),
        odometerBefore: toNullableNumber(runningLog.beforeKm),
        status: toStringValue(runningLog.status),
      }
    : null;

  return {
    vehicleNumber: toStringValue(vehicle.carNo),
    vehicleName: toStringValue(vehicle.carName),
    masterStatus: toStringValue(vehicle.masterStatus),
    selectable: vehicle.selectable === true,
    displayStatus:
      toStringValue(vehicle.status) ||
      toStringValue(vehicle.masterStatus) ||
      "미사용",
    activeLog,
    recentMileage:
      activeLog?.odometerBefore ?? toNullableNumber(vehicle.lastAfterKm),
  };
}

function createSummary(vehicles: VehicleStatusItem[]): VehicleSummary {
  return {
    total: vehicles.length,
    waiting: vehicles.filter((vehicle) => vehicle.displayStatus === "대기중")
      .length,
    driving: vehicles.filter((vehicle) => vehicle.displayStatus === "운행중")
      .length,
    longDriving: vehicles.filter(
      (vehicle) => vehicle.displayStatus === "장기운행중"
    ).length,
    unavailable: vehicles.filter((vehicle) => !vehicle.selectable).length,
  };
}

function normalizeLog(log: AppsScriptVehicleLog): VehicleDrivingLog {
  return {
    logId: toStringValue(log.logId) || `vehicle-log-${toStringValue(log.rowNumber)}`,
    rowNumber: toNullableNumber(log.rowNumber) ?? 0,
    startedAt: toNullableString(log.startTime),
    endedAt: toNullableString(log.endTime),
    vehicleNumber: toStringValue(log.carNo),
    department: toStringValue(log.dept),
    driverName: toStringValue(log.driverName),
    destination: toStringValue(log.destination),
    odometerBefore: toNullableNumber(log.beforeKm),
    odometerAfter: toNullableNumber(log.afterKm),
    distance: toNullableNumber(log.distance),
    drivingHours: toNullableNumber(log.drivingHours),
    fueled: log.fuelYn === true,
    fuelAmount: toNullableNumber(log.fuelAmount),
    memo: toNullableString(log.memo),
    status: toStringValue(log.status),
  };
}

function sortLogs(logs: VehicleDrivingLog[]) {
  return logs.sort((a, b) => {
    if (a.startedAt && b.startedAt) {
      const difference =
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      return difference || b.rowNumber - a.rowNumber;
    }
    if (a.startedAt) return -1;
    if (b.startedAt) return 1;
    return b.rowNumber - a.rowNumber;
  });
}

function subtractOneMonth(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const previousMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const date = new Date(
    Date.UTC(year, month - 2, Math.min(day, previousMonthLastDay))
  );
  return date.toISOString().slice(0, 10);
}

export function getDefaultVehicleLogFilters(): VehicleLogFilters {
  const endDate = getTodayDate();
  return {
    startDate: subtractOneMonth(endDate),
    endDate,
    vehicleNumber: "",
    department: "",
    driverName: "",
    status: "",
  };
}

export function normalizeVehicleLogFilters(
  filters: Partial<VehicleLogFilters>
): VehicleLogFilters {
  const defaults = getDefaultVehicleLogFilters();

  return {
    startDate: filters.startDate?.trim() ?? defaults.startDate,
    endDate: filters.endDate?.trim() ?? defaults.endDate,
    vehicleNumber: filters.vehicleNumber?.trim() ?? "",
    department: filters.department?.trim() ?? "",
    driverName: filters.driverName?.trim() ?? "",
    status: filters.status?.trim() ?? "",
  };
}

export async function fetchVehicleDashboard(
  forceRefresh = false
): Promise<VehicleDashboard> {
  const data = await getVehicleDashboardFromApi(forceRefresh);
  const vehicles = (data.cars ?? [])
    .map(normalizeVehicle)
    .filter((vehicle) => vehicle.vehicleNumber);

  return {
    vehicles,
    departments: toDepartments(data.depts),
    summary: createSummary(vehicles),
  };
}

export async function fetchVehicleLogs(
  filters: VehicleLogFilters,
  forceRefresh = false
): Promise<VehicleLogData> {
  const data = await getVehicleLogsFromApi(filters, forceRefresh);
  return {
    logs: sortLogs((data.logs ?? []).map(normalizeLog)).slice(0, 20),
    departments: toDepartments(data.depts),
  };
}
