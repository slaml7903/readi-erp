export type VehicleDisplayStatus =
  | "대기중"
  | "운행중"
  | "장기운행중"
  | string;

export type VehicleRunningLog = {
  rowNumber: number;
  startedAt: string | null;
  department: string;
  driverName: string;
  destination: string;
  odometerBefore: number | null;
  status: string;
};

export type VehicleStatusItem = {
  vehicleNumber: string;
  vehicleName: string;
  masterStatus: string;
  selectable: boolean;
  displayStatus: VehicleDisplayStatus;
  activeLog: VehicleRunningLog | null;
  recentMileage: number | null;
};

export type VehicleSummary = {
  total: number;
  waiting: number;
  driving: number;
  longDriving: number;
  unavailable: number;
};

export type VehicleDashboard = {
  vehicles: VehicleStatusItem[];
  departments: string[];
  summary: VehicleSummary;
};

export type VehicleDrivingLog = {
  logId: string;
  rowNumber: number;
  startedAt: string | null;
  endedAt: string | null;
  vehicleNumber: string;
  department: string;
  driverName: string;
  destination: string;
  odometerBefore: number | null;
  odometerAfter: number | null;
  distance: number | null;
  drivingHours: number | null;
  fueled: boolean;
  fuelAmount: number | null;
  memo: string | null;
  status: string;
};

export type VehicleLogFilters = {
  startDate: string;
  endDate: string;
  vehicleNumber: string;
  department: string;
  driverName: string;
  status: string;
};

export type VehicleLogData = {
  logs: VehicleDrivingLog[];
  departments: string[];
};

export type VehiclePageData = {
  dashboard: VehicleDashboard;
  logData: VehicleLogData;
  filters: VehicleLogFilters;
  defaultFilters: VehicleLogFilters;
  filterApplied: boolean;
};
