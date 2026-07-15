import "server-only";

import type { VehicleLogFilters } from "../types/vehicle.type";

const VEHICLE_DASHBOARD_CACHE_TAG = "vehicle-dashboard";
const VEHICLE_LOGS_CACHE_TAG = "vehicle-driving-logs";

type AppsScriptRunningLog = {
  rowNumber?: unknown;
  startTime?: unknown;
  dept?: unknown;
  name?: unknown;
  destination?: unknown;
  beforeKm?: unknown;
  status?: unknown;
};

export type AppsScriptVehicle = {
  carNo?: unknown;
  carName?: unknown;
  masterStatus?: unknown;
  selectable?: unknown;
  status?: unknown;
  runningLog?: AppsScriptRunningLog | null;
  lastAfterKm?: unknown;
};

export type AppsScriptVehicleLog = {
  logId?: unknown;
  rowNumber?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  carNo?: unknown;
  dept?: unknown;
  driverName?: unknown;
  destination?: unknown;
  beforeKm?: unknown;
  afterKm?: unknown;
  distance?: unknown;
  drivingHours?: unknown;
  fuelYn?: unknown;
  fuelAmount?: unknown;
  memo?: unknown;
  status?: unknown;
};

type AppsScriptResponse<TData> = {
  ok?: boolean;
  data?: TData;
  message?: string;
};

export class VehicleApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleApiError";
  }
}

function getVehicleApiUrl() {
  const value = process.env.GOOGLE_VEHICLE_API_URL?.trim();

  if (!value) {
    throw new VehicleApiError(
      "GOOGLE_VEHICLE_API_URL 환경변수가 설정되지 않았습니다."
    );
  }

  try {
    return new URL(value);
  } catch {
    throw new VehicleApiError(
      "GOOGLE_VEHICLE_API_URL 환경변수가 올바른 URL이 아닙니다."
    );
  }
}

function addParameter(url: URL, name: string, value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue) url.searchParams.set(name, normalizedValue);
}

async function fetchVehicleApi<TData>(
  url: URL,
  {
    revalidate,
    tag,
    forceRefresh,
  }: { revalidate: number; tag: string; forceRefresh?: boolean }
) {
  const response = await fetch(url.toString(),
    forceRefresh
      ? { cache: "no-store" }
      : {
          cache: "force-cache",
          next: { revalidate, tags: [tag] },
        }
  );

  if (!response.ok) {
    throw new VehicleApiError(
      `차량 조회 API가 HTTP ${response.status} 오류를 반환했습니다.`
    );
  }

  let body: AppsScriptResponse<TData>;

  try {
    body = (await response.json()) as AppsScriptResponse<TData>;
  } catch {
    throw new VehicleApiError("차량 조회 API 응답이 JSON 형식이 아닙니다.");
  }

  if (!body.ok || !body.data) {
    throw new VehicleApiError(
      body.message?.trim() || "차량 데이터를 조회하지 못했습니다."
    );
  }

  return body.data;
}

export async function getVehicleDashboardFromApi(forceRefresh = false) {
  const url = getVehicleApiUrl();
  url.searchParams.set("mode", "api");
  url.searchParams.set("action", "dashboard");

  return fetchVehicleApi<{
    cars?: AppsScriptVehicle[];
    depts?: unknown[];
  }>(url, {
    revalidate: 30,
    tag: VEHICLE_DASHBOARD_CACHE_TAG,
    forceRefresh,
  });
}

export async function getVehicleLogsFromApi(
  filters: VehicleLogFilters,
  forceRefresh = false
) {
  const url = getVehicleApiUrl();
  url.searchParams.set("mode", "api");
  url.searchParams.set("action", "logs");
  url.searchParams.set("limit", "20");
  addParameter(url, "startDate", filters.startDate);
  addParameter(url, "endDate", filters.endDate);
  addParameter(url, "carNo", filters.vehicleNumber);
  addParameter(url, "dept", filters.department);
  addParameter(url, "driverName", filters.driverName);
  addParameter(url, "status", filters.status);

  return fetchVehicleApi<{
    logs?: AppsScriptVehicleLog[];
    depts?: unknown[];
  }>(url, {
    revalidate: 60,
    tag: VEHICLE_LOGS_CACHE_TAG,
    forceRefresh,
  });
}

export const vehicleApiCachePolicy = {
  dashboardSeconds: 30,
  logsSeconds: 60,
} as const;
