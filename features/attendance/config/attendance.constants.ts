import type { AttendanceTypeConfig, Holiday } from "../types/attendance.type";

export const ATTENDANCE_REQUEST_TYPES = [
  "연차",
  "오전 반차",
  "오후 반차",
  "출장",
  "외근",
  "유연근무",
];

export const FLEXIBLE_WORK_OPTIONS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
];

export const ATTENDANCE_DISPLAY = {
  weekDays: ["일", "월", "화", "수", "목", "금", "토"],
  maxVisibleEvents: 4,
  maxVisibleRangeLanes: 3,
} as const;

export const ATTENDANCE_TYPE_CONFIG: Record<string, AttendanceTypeConfig> = {
  연차: {
    order: 1,
    style: "border-blue-200 bg-blue-50 text-blue-800",
    ranged: true,
  },
  출장: {
    order: 2,
    style: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ranged: true,
  },
  반차: {
    order: 3,
    style: "border-cyan-200 bg-cyan-50 text-cyan-800",
  },
  "오전 반차": {
    order: 3,
    singleOrder: 1,
    style: "border-sky-200 bg-sky-50 text-sky-800",
  },
  "오후 반차": {
    order: 3,
    singleOrder: 2,
    style: "border-cyan-200 bg-cyan-50 text-cyan-800",
  },
  외근: {
    order: 4,
    singleOrder: 4,
    style: "border-orange-200 bg-orange-50 text-orange-800",
  },
  유연근무: {
    order: 5,
    singleOrder: 3,
    style: "border-violet-200 bg-violet-50 text-violet-800",
  },
};

export const DEFAULT_ATTENDANCE_TYPE_STYLE =
  "border-gray-200 bg-gray-50 text-gray-700";

export const MOVABLE_KOREAN_HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: [
    { date: "2025-01-28", name: "설날 연휴" },
    { date: "2025-01-29", name: "설날" },
    { date: "2025-01-30", name: "설날 연휴" },
    { date: "2025-05-05", name: "부처님오신날" },
    { date: "2025-10-05", name: "추석 연휴" },
    { date: "2025-10-06", name: "추석" },
    { date: "2025-10-07", name: "추석 연휴" },
    { date: "2025-10-08", name: "대체공휴일" },
  ],
  2026: [
    { date: "2026-02-16", name: "설날 연휴" },
    { date: "2026-02-17", name: "설날" },
    { date: "2026-02-18", name: "설날 연휴" },
    { date: "2026-03-02", name: "대체공휴일" },
    { date: "2026-05-24", name: "부처님오신날" },
    { date: "2026-05-25", name: "대체공휴일" },
    { date: "2026-08-17", name: "대체공휴일" },
    { date: "2026-09-24", name: "추석 연휴" },
    { date: "2026-09-25", name: "추석" },
    { date: "2026-09-26", name: "추석 연휴" },
    { date: "2026-09-27", name: "대체공휴일" },
    { date: "2026-10-05", name: "대체공휴일" },
  ],
  2027: [
    { date: "2027-02-07", name: "설날 연휴" },
    { date: "2027-02-08", name: "설날" },
    { date: "2027-02-09", name: "설날 연휴" },
    { date: "2027-03-02", name: "대체공휴일" },
    { date: "2027-05-13", name: "부처님오신날" },
    { date: "2027-08-16", name: "대체공휴일" },
    { date: "2027-09-14", name: "추석 연휴" },
    { date: "2027-09-15", name: "추석" },
    { date: "2027-09-16", name: "추석 연휴" },
    { date: "2027-10-04", name: "대체공휴일" },
    { date: "2027-10-11", name: "대체공휴일" },
    { date: "2027-12-27", name: "대체공휴일" },
  ],
};
