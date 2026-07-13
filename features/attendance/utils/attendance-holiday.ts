import { MOVABLE_KOREAN_HOLIDAYS_BY_YEAR } from "../config/attendance.constants";
import type { Holiday } from "../types/attendance-calendar.type";

function getFixedSolarHolidays(year: number): Holiday[] {
  return [
    { date: `${year}-01-01`, name: "신정" },
    { date: `${year}-03-01`, name: "삼일절" },
    { date: `${year}-05-01`, name: "근로자의 날" },
    { date: `${year}-05-05`, name: "어린이날" },
    { date: `${year}-06-06`, name: "현충일" },
    { date: `${year}-08-15`, name: "광복절" },
    { date: `${year}-10-03`, name: "개천절" },
    { date: `${year}-10-09`, name: "한글날" },
    { date: `${year}-12-25`, name: "성탄절" },
  ];
}

export function createHolidayMap(month: string) {
  const year = Number(month.slice(0, 4));
  const holidays = [
    ...getFixedSolarHolidays(year),
    ...(MOVABLE_KOREAN_HOLIDAYS_BY_YEAR[year] ?? []),
  ];

  return new Map(holidays.map((holiday) => [holiday.date, holiday]));
}
