import { ATTENDANCE_DISPLAY } from "../config/attendance.constants";
import type { Holiday } from "../types/attendance-calendar.type";
import type { AttendanceEvent } from "../types/attendance.type";
import type { CalendarWeek } from "../types/attendance-calendar.type";
import AttendanceWeekRow from "./AttendanceWeekRow";

type AttendanceCalendarGridProps = {
  weeks: CalendarWeek[];
  events: AttendanceEvent[];
  holidayMap: Map<string, Holiday>;
  today: string;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: AttendanceEvent) => void;
  onSelectGroup: (events: AttendanceEvent[]) => void;
};

export default function AttendanceCalendarGrid({
  weeks,
  events,
  holidayMap,
  today,
  onSelectDate,
  onSelectEvent,
  onSelectGroup,
}: AttendanceCalendarGridProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {ATTENDANCE_DISPLAY.weekDays.map((weekday, index) => (
          <div
            key={weekday}
            className={`px-3 py-2 text-center text-sm font-semibold ${
              index === 0
                ? "text-red-500"
                : index === 6
                  ? "text-blue-500"
                  : "text-gray-600"
            }`}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div>
        {weeks.map((week) => (
          <AttendanceWeekRow
            key={week.startDate}
            week={week}
            events={events}
            holidayMap={holidayMap}
            today={today}
            onSelectDate={onSelectDate}
            onSelectEvent={onSelectEvent}
            onSelectGroup={onSelectGroup}
          />
        ))}
      </div>
    </div>
  );
}
