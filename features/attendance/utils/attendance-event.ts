import { formatDate } from "@/lib/date";

import {
  ATTENDANCE_TYPE_CONFIG,
  DEFAULT_ATTENDANCE_TYPE_STYLE,
} from "../config/attendance.constants";
import type {
  CalendarWeek,
  RangedEventSegment,
  SingleCalendarItem,
} from "../types/attendance-calendar.type";
import type { AttendanceEvent } from "../types/attendance.type";

export function isRangedEvent(event: AttendanceEvent) {
  return event.attendanceType === "연차" || event.attendanceType === "출장";
}

export function getEventDuration(event: AttendanceEvent) {
  return event.endDate.localeCompare(event.startDate);
}

export function getEventsForDate(events: AttendanceEvent[], date: string) {
  return events.filter((event) => event.startDate <= date && event.endDate >= date);
}

export function getEventTitle(event: AttendanceEvent) {
  if (event.attendanceType === "유연근무") {
    return `${event.employeeName} · ${event.flexibleWorkType || "유연근무"}`;
  }

  if (event.attendanceType === "외근") {
    return `${event.employeeName} · 외근${
      event.outsideWorkTime ? ` ${event.outsideWorkTime}` : ""
    }`;
  }

  return `${event.employeeName} · ${event.attendanceType || "근태"}`;
}

export function getEventStyle(type: string) {
  return ATTENDANCE_TYPE_CONFIG[type]?.style ?? DEFAULT_ATTENDANCE_TYPE_STYLE;
}

export function getSingleItemOrder(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") {
    return ATTENDANCE_TYPE_CONFIG["유연근무"]?.singleOrder ?? 99;
  }

  return ATTENDANCE_TYPE_CONFIG[item.event.attendanceType]?.singleOrder ?? 99;
}

export function getAttendanceTypeOrder(type: string) {
  return ATTENDANCE_TYPE_CONFIG[type]?.order ?? 99;
}

export function getSingleItemTitle(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") {
    return `유연근무 ${item.events.length}명`;
  }

  return getEventTitle(item.event);
}

export function getSingleItemStyle(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") return getEventStyle("유연근무");
  return getEventStyle(item.event.attendanceType);
}

export function createSingleItems(
  events: AttendanceEvent[],
  date: string
): SingleCalendarItem[] {
  const flexibleEvents = events.filter(
    (event) => event.attendanceType === "유연근무"
  );
  const items: SingleCalendarItem[] = events
    .filter((event) => event.attendanceType !== "유연근무")
    .map((event) => ({ kind: "event", event }));

  if (flexibleEvents.length > 0) {
    items.push({
      kind: "flexibleGroup",
      date,
      events: flexibleEvents.sort((a, b) =>
        a.employeeName.localeCompare(b.employeeName, "ko")
      ),
    });
  }

  return items.sort((a, b) => {
    const typeOrder = getSingleItemOrder(a) - getSingleItemOrder(b);
    if (typeOrder !== 0) return typeOrder;
    return getSingleItemTitle(a).localeCompare(getSingleItemTitle(b), "ko");
  });
}

export function sortRangedEvents(events: AttendanceEvent[]) {
  return [...events].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    const durationOrder = getEventDuration(b) - getEventDuration(a);
    if (durationOrder !== 0) return durationOrder;
    return a.employeeName.localeCompare(b.employeeName, "ko");
  });
}

export function getTypeGroupLabel(type: string) {
  if (type === "오전 반차" || type === "오후 반차") return "반차";
  return type || "기타";
}

export function createRangedEventSegments(
  events: AttendanceEvent[],
  week: CalendarWeek
): RangedEventSegment[] {
  const rangedEvents = sortRangedEvents(
    events.filter(
      (event) =>
        isRangedEvent(event) &&
        event.startDate <= week.endDate &&
        event.endDate >= week.startDate
    )
  );
  const laneEndIndexes: number[] = [];

  return rangedEvents.map((event) => {
    const clippedStartDate =
      event.startDate > week.startDate ? event.startDate : week.startDate;
    const clippedEndDate =
      event.endDate < week.endDate ? event.endDate : week.endDate;
    const startIndex = week.days.findIndex((day) => day.date === clippedStartDate);
    const endIndex = week.days.findIndex((day) => day.date === clippedEndDate);
    const clippedStartIndex = startIndex === -1 ? 0 : startIndex;
    const clippedEndIndex = endIndex === -1 ? 6 : endIndex;
    const lane = laneEndIndexes.findIndex(
      (laneEndIndex) => laneEndIndex < clippedStartIndex
    );
    const nextLane = lane === -1 ? laneEndIndexes.length : lane;
    laneEndIndexes[nextLane] = clippedEndIndex;

    return {
      event,
      startIndex: clippedStartIndex,
      endIndex: clippedEndIndex,
      lane: nextLane,
      isStart: event.startDate === clippedStartDate,
    };
  });
}

export function getDetailType(event: AttendanceEvent) {
  if (event.attendanceType === "유연근무" && event.flexibleWorkType) {
    return `${event.attendanceType} · ${event.flexibleWorkType}`;
  }

  return event.attendanceType || "기타";
}

export function getDetailPeriod(event: AttendanceEvent) {
  if (!event.startDate) return "";
  if (!event.endDate || event.startDate === event.endDate) {
    return formatDate(event.startDate);
  }

  return `${formatDate(event.startDate)} ~ ${formatDate(event.endDate)}`;
}
