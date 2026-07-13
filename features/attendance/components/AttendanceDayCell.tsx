import { ATTENDANCE_DISPLAY } from "../config/attendance.constants";
import type { CalendarDay, Holiday } from "../types/attendance-calendar.type";
import type { AttendanceEvent } from "../types/attendance.type";
import { AttendanceSingleEventItem } from "./AttendanceEventItem";
import {
  createSingleItems,
  getEventsForDate,
  isRangedEvent,
} from "../utils/attendance-event";
import type { RangedEventSegment } from "../types/attendance-calendar.type";

type AttendanceDayCellProps = {
  day: CalendarDay;
  dayIndex: number;
  events: AttendanceEvent[];
  rangedSegments: RangedEventSegment[];
  rangeLaneCount: number;
  today: string;
  holiday?: Holiday;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: AttendanceEvent) => void;
  onSelectGroup: (events: AttendanceEvent[]) => void;
};

export default function AttendanceDayCell({
  day,
  dayIndex,
  events,
  rangedSegments,
  rangeLaneCount,
  today,
  holiday,
  onSelectDate,
  onSelectEvent,
  onSelectGroup,
}: AttendanceDayCellProps) {
  const dayEvents = getEventsForDate(events, day.date);
  const singleItems = createSingleItems(
    dayEvents.filter((event) => !isRangedEvent(event)),
    day.date
  );
  const rangeEventsOnDay = rangedSegments.filter(
    (segment) => segment.startIndex <= dayIndex && segment.endIndex >= dayIndex
  );
  const hiddenRangeCount = Math.max(
    rangeEventsOnDay.length - ATTENDANCE_DISPLAY.maxVisibleRangeLanes,
    0
  );
  const visibleSingleCount = Math.max(
    ATTENDANCE_DISPLAY.maxVisibleEvents -
      Math.min(rangeEventsOnDay.length, ATTENDANCE_DISPLAY.maxVisibleRangeLanes),
    0
  );
  const visibleSingleItems = singleItems.slice(0, visibleSingleCount);
  const hiddenEventCount =
    hiddenRangeCount + Math.max(singleItems.length - visibleSingleItems.length, 0);
  const isToday = day.date === today;
  const isHoliday = dayIndex === 0 || Boolean(holiday);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectDate(day.date)}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter") {
          onSelectDate(day.date);
        }
      }}
      className={`min-h-44 border-r border-gray-100 p-2 text-left transition hover:bg-gray-50 ${
        day.inMonth ? "bg-white" : "bg-gray-50/70 text-gray-400"
      } ${holiday ? "bg-red-50/40" : ""}`}
    >
      <div className="mb-1 min-h-10">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
            isToday
              ? "bg-gray-900 text-white"
              : isHoliday
                ? "text-red-500"
                : dayIndex === 6
                  ? "text-blue-500"
                  : "text-gray-700"
          }`}
        >
          {day.dayNumber}
        </div>
        {holiday && (
          <p className="mt-1 truncate text-xs font-medium text-red-500">
            {holiday.name}
          </p>
        )}
      </div>

      <div
        className="space-y-1"
        style={{ paddingTop: `${rangeLaneCount * 26}px` }}
      >
        {visibleSingleItems.map((item) => (
          <AttendanceSingleEventItem
            key={
              item.kind === "flexibleGroup"
                ? `flexible-${item.date}`
                : item.event.id
            }
            item={item}
            onSelectEvent={onSelectEvent}
            onSelectGroup={onSelectGroup}
          />
        ))}
        {hiddenEventCount > 0 && (
          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onSelectDate(day.date);
            }}
            className="text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            +{hiddenEventCount}개 더보기
          </button>
        )}
      </div>
    </div>
  );
}
