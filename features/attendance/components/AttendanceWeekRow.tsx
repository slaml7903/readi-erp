import { ATTENDANCE_DISPLAY } from "../config/attendance.constants";
import type { CalendarWeek, Holiday } from "../types/attendance-calendar.type";
import type { AttendanceEvent } from "../types/attendance.type";
import AttendanceDayCell from "./AttendanceDayCell";
import { AttendanceRangeEventItem } from "./AttendanceEventItem";
import { createRangedEventSegments } from "../utils/attendance-event";

type AttendanceWeekRowProps = {
  week: CalendarWeek;
  events: AttendanceEvent[];
  holidayMap: Map<string, Holiday>;
  today: string;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: AttendanceEvent) => void;
  onSelectGroup: (events: AttendanceEvent[]) => void;
};

export default function AttendanceWeekRow({
  week,
  events,
  holidayMap,
  today,
  onSelectDate,
  onSelectEvent,
  onSelectGroup,
}: AttendanceWeekRowProps) {
  const rangedSegments = createRangedEventSegments(events, week);
  const visibleRangedSegments = rangedSegments.filter(
    (segment) => segment.lane < ATTENDANCE_DISPLAY.maxVisibleRangeLanes
  );
  const rangeLaneCount = Math.min(
    Math.max(...rangedSegments.map((segment) => segment.lane + 1), 0),
    ATTENDANCE_DISPLAY.maxVisibleRangeLanes
  );

  return (
    <div
      key={week.startDate}
      className="relative grid min-h-44 grid-cols-7 border-b border-gray-100"
    >
      {week.days.map((day, dayIndex) => (
        <AttendanceDayCell
          key={day.date}
          day={day}
          dayIndex={dayIndex}
          events={events}
          rangedSegments={rangedSegments}
          rangeLaneCount={rangeLaneCount}
          today={today}
          holiday={holidayMap.get(day.date)}
          onSelectDate={onSelectDate}
          onSelectEvent={onSelectEvent}
          onSelectGroup={onSelectGroup}
        />
      ))}

      <div className="pointer-events-none absolute inset-x-0 top-12 grid grid-cols-7 gap-y-1">
        {visibleRangedSegments.map((segment) => (
          <AttendanceRangeEventItem
            key={`${segment.event.id}-${week.startDate}`}
            segment={segment}
            weekStartDate={week.startDate}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}
