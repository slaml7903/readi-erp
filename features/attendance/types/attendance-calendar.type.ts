import type { AttendanceEvent } from "./attendance.type";

export type CalendarDay = {
  date: string;
  dayNumber: number;
  inMonth: boolean;
};

export type CalendarWeek = {
  days: CalendarDay[];
  startDate: string;
  endDate: string;
};

export type Holiday = {
  date: string;
  name: string;
};

export type RangedEventSegment = {
  event: AttendanceEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  isStart: boolean;
};

export type FlexibleWorkGroup = {
  kind: "flexibleGroup";
  date: string;
  events: AttendanceEvent[];
};

export type SingleCalendarItem =
  | { kind: "event"; event: AttendanceEvent }
  | FlexibleWorkGroup;

export type SummaryCardKey =
  | "all"
  | "businessTrip"
  | "outsideWork"
  | "morningHalfDay"
  | "afternoonHalfDay"
  | "annualLeave";
