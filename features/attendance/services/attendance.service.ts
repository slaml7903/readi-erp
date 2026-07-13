import {
  createAttendanceRequest,
  getAttendanceEmployees,
  getAttendanceEventsByDate,
  getAttendanceEventsByMonth,
} from "../repository/attendance.repository";
import { countUniqueBy, parseMultiValue, uniqueValues } from "@/lib/data";
import { getTodayDate } from "@/lib/date";

import type {
  AttendanceDashboardData,
  AttendanceEvent,
  AttendanceFilters,
  AttendanceSummary,
  CreateAttendanceRequestInput,
} from "../types/attendance.type";

const ABSENCE_TYPES = ["연차", "출장", "오전 반차", "오후 반차"] as const;
const REQUEST_TYPES = ["연차", "오전 반차", "오후 반차", "출장", "외근", "유연근무"];

export class AttendanceRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceRequestValidationError";
  }
}

function normalizeMonth(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  return getTodayDate().slice(0, 7);
}

function matchesFilters(event: AttendanceEvent, filters: AttendanceFilters) {
  const departments = parseMultiValue(filters.department);
  const types = parseMultiValue(filters.type);

  if (departments.length > 0 && !departments.includes(event.department)) {
    return false;
  }

  if (types.length > 0 && !types.includes(event.attendanceType)) {
    return false;
  }

  if (
    filters.employee &&
    !event.employeeName.toLowerCase().includes(filters.employee.toLowerCase())
  ) {
    return false;
  }

  return true;
}

function countUniqueEmployees(events: AttendanceEvent[], type: string) {
  return countUniqueBy(
    events.filter((event) => event.attendanceType === type),
    (event) => event.employeeId ?? event.employeeName
  );
}

function isTodayAttendanceEvent(event: AttendanceEvent, today: string) {
  if (event.attendanceType === "연차" || event.attendanceType === "출장") {
    return event.startDate <= today && event.endDate >= today;
  }

  return event.startDate === today;
}

function createSummary(
  todayEvents: AttendanceEvent[],
  activeEmployeeCount: number
): AttendanceSummary {
  const annualLeaveCount = countUniqueEmployees(todayEvents, "연차");
  const businessTripCount = countUniqueEmployees(todayEvents, "출장");
  const morningHalfDayCount = countUniqueEmployees(todayEvents, "오전 반차");
  const afternoonHalfDayCount = countUniqueEmployees(todayEvents, "오후 반차");
  const flexibleWorkCount = countUniqueEmployees(todayEvents, "유연근무");
  const outsideWorkCount = countUniqueEmployees(todayEvents, "외근");

  const absentEmployeeIds = new Set(
    todayEvents
      .filter((event) =>
        ABSENCE_TYPES.includes(event.attendanceType as (typeof ABSENCE_TYPES)[number])
      )
      .map((event) => event.employeeId ?? event.employeeName)
  );

  return {
    activeEmployeeCount,
    normalWorkCount: Math.max(activeEmployeeCount - absentEmployeeIds.size, 0),
    annualLeaveCount,
    businessTripCount,
    morningHalfDayCount,
    afternoonHalfDayCount,
    flexibleWorkCount,
    outsideWorkCount,
  };
}

async function fetchAttendanceMonthData(
  filters: AttendanceFilters,
  month: string
) {
  const events = await getAttendanceEventsByMonth(month);

  return events
    .filter((event) => !event.hasDateError)
    .filter((event) => matchesFilters(event, { ...filters, month }))
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.employeeName.localeCompare(b.employeeName, "ko");
    });
}

async function fetchTodayAttendanceSummary(activeEmployeeCount: number) {
  const today = getTodayDate();
  const todayEvents = (await getAttendanceEventsByDate(today)).filter(
    (event) => !event.hasDateError && isTodayAttendanceEvent(event, today)
  );

  return {
    summary: createSummary(todayEvents, activeEmployeeCount),
    todayEvents,
  };
}

export async function fetchAttendanceDashboard(
  filters: AttendanceFilters
): Promise<AttendanceDashboardData> {
  const month = normalizeMonth(filters.month);
  const [events, employees] = await Promise.all([
    fetchAttendanceMonthData(filters, month),
    getAttendanceEmployees(),
  ]);

  const activeEmployees = employees.filter((employee) => {
    const status = employee.status.trim();
    return status.includes("재직") && !status.includes("퇴");
  });
  const { summary, todayEvents } = await fetchTodayAttendanceSummary(
    activeEmployees.length
  );
  const filterOptions = {
    departments: uniqueValues(employees, (employee) => employee.department),
    types: REQUEST_TYPES,
  };

  return {
    month,
    events,
    summary,
    summaryDetails: {
      activeEmployees,
      todayEvents,
    },
    filterOptions,
  };
}

export async function submitAttendanceRequest(input: CreateAttendanceRequestInput) {
  validateAttendanceRequestInput(input);
  return await createAttendanceRequest(input);
}

function validateAttendanceRequestInput(input: CreateAttendanceRequestInput) {
  if (!input.employeeId) {
    throw new AttendanceRequestValidationError("신청자를 선택해 주세요.");
  }

  if (!REQUEST_TYPES.includes(input.attendanceType)) {
    throw new AttendanceRequestValidationError("근태 유형을 선택해 주세요.");
  }

  if (!input.startDate) {
    throw new AttendanceRequestValidationError("시작일을 입력해 주세요.");
  }

  if (
    (input.attendanceType === "연차" || input.attendanceType === "출장") &&
    input.endDate &&
    input.endDate < input.startDate
  ) {
    throw new AttendanceRequestValidationError(
      "종료일은 시작일보다 빠를 수 없습니다."
    );
  }

  if (input.attendanceType === "연차" && !input.endDate) {
    throw new AttendanceRequestValidationError("연차 종료일을 입력해 주세요.");
  }

  if (
    (input.attendanceType === "연차" || input.attendanceType === "출장") &&
    !input.purpose
  ) {
    throw new AttendanceRequestValidationError("사유/목적을 입력해 주세요.");
  }

  if (input.attendanceType === "출장" && !input.location) {
    throw new AttendanceRequestValidationError("출장 장소를 입력해 주세요.");
  }

  if (input.attendanceType === "외근" && !input.outsideWorkDateTime) {
    throw new AttendanceRequestValidationError("외근 일시를 입력해 주세요.");
  }

  if (input.attendanceType === "유연근무" && !input.flexibleWorkType) {
    throw new AttendanceRequestValidationError("유연근무 종류를 입력해 주세요.");
  }
}
