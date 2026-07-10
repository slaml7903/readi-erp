export type AttendanceEvent = {
  id: string;
  requestNumber: string;
  employeeId: string | null;
  employeeName: string;
  department: string;
  position: string;
  attendanceType: string;
  flexibleWorkType: string;
  location: string;
  purpose: string;
  startDate: string;
  endDate: string;
  outsideWorkTime: string;
  createdAt: string;
  hasDateError: boolean;
};

export type Holiday = {
  date: string;
  name: string;
};

export type AttendanceTypeConfig = {
  order: number;
  singleOrder?: number;
  style: string;
  ranged?: boolean;
};

export type AttendanceEmployee = {
  id: string;
  name: string;
  department: string;
  position: string;
  status: string;
};

export type AttendanceFilters = {
  month: string;
  department?: string;
  type?: string;
  employee?: string;
};

export type CreateAttendanceRequestInput = {
  employeeId: string;
  attendanceType: string;
  flexibleWorkType?: string;
  location?: string;
  purpose?: string;
  outsideWorkDateTime?: string;
  startDate: string;
  endDate?: string;
};

export type AttendanceSummary = {
  activeEmployeeCount: number;
  normalWorkCount: number;
  annualLeaveCount: number;
  businessTripCount: number;
  morningHalfDayCount: number;
  afternoonHalfDayCount: number;
  flexibleWorkCount: number;
  outsideWorkCount: number;
};

export type AttendanceFilterOptions = {
  departments: string[];
  types: string[];
};

export type AttendanceDashboardData = {
  month: string;
  events: AttendanceEvent[];
  summary: AttendanceSummary;
  summaryDetails: {
    activeEmployees: AttendanceEmployee[];
    todayEvents: AttendanceEvent[];
  };
  filterOptions: AttendanceFilterOptions;
};
