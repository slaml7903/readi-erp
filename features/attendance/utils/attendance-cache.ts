export const ATTENDANCE_EMPLOYEES_TAG = "attendance-employees";

export function getAttendanceEventsTag(month: string) {
  return `attendance-events-${month}`;
}

export function getAttendanceTodayTag(date: string) {
  return `attendance-today-${date}`;
}

export function getAffectedAttendanceMonths(
  startDate: string,
  endDate?: string
) {
  const startMonth = startDate.slice(0, 7);
  const endMonth = (endDate || startDate).slice(0, 7);
  const [startYear, startMonthIndex] = startMonth.split("-").map(Number);
  const [endYear, endMonthIndex] = endMonth.split("-").map(Number);
  const months: string[] = [];
  const cursor = new Date(Date.UTC(startYear, startMonthIndex - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonthIndex - 1, 1));

  while (cursor <= end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

export function isDateInRange(date: string, startDate: string, endDate?: string) {
  const normalizedEndDate = endDate || startDate;
  return startDate <= date && date <= normalizedEndDate;
}
