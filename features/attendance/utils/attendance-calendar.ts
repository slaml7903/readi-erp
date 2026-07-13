import { toDateKey } from "@/lib/date";

import type { CalendarWeek } from "../types/attendance-calendar.type";

export function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

export function createCalendarWeeks(month: string): CalendarWeek[] {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const startDate = new Date(firstDate);
  startDate.setUTCDate(firstDate.getUTCDate() - firstDate.getUTCDay());

  return Array.from({ length: 6 }, (_, weekIndex) => {
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + weekIndex * 7 + dayIndex);

      return {
        date: toDateKey(date),
        dayNumber: date.getUTCDate(),
        inMonth: date.getUTCMonth() === monthIndex - 1,
      };
    });

    return {
      days,
      startDate: days[0].date,
      endDate: days[6].date,
    };
  });
}
