import type {
  RangedEventSegment,
  SingleCalendarItem,
} from "../types/attendance-calendar.type";
import type { AttendanceEvent } from "../types/attendance.type";
import {
  getEventStyle,
  getEventTitle,
  getSingleItemStyle,
  getSingleItemTitle,
} from "../utils/attendance-event";

export function AttendanceSingleEventItem({
  item,
  onSelectEvent,
  onSelectGroup,
}: {
  item: SingleCalendarItem;
  onSelectEvent: (event: AttendanceEvent) => void;
  onSelectGroup: (events: AttendanceEvent[]) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        if (item.kind === "flexibleGroup") {
          onSelectGroup(item.events);
        } else {
          onSelectEvent(item.event);
        }
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter") {
          keyEvent.stopPropagation();
          if (item.kind === "flexibleGroup") {
            onSelectGroup(item.events);
          } else {
            onSelectEvent(item.event);
          }
        }
      }}
      className={`flex h-6 items-center truncate rounded border px-2 text-xs font-medium ${getSingleItemStyle(
        item
      )}`}
      title={getSingleItemTitle(item)}
    >
      {getSingleItemTitle(item)}
    </div>
  );
}

export function AttendanceRangeEventItem({
  segment,
  weekStartDate,
  onSelectEvent,
}: {
  segment: RangedEventSegment;
  weekStartDate: string;
  onSelectEvent: (event: AttendanceEvent) => void;
}) {
  return (
    <button
      key={`${segment.event.id}-${weekStartDate}`}
      type="button"
      onClick={() => onSelectEvent(segment.event)}
      className={`pointer-events-auto mx-2 h-6 truncate rounded border px-2 text-left text-xs font-medium ${getEventStyle(
        segment.event.attendanceType
      )}`}
      style={{
        gridColumn: `${segment.startIndex + 1} / span ${
          segment.endIndex - segment.startIndex + 1
        }`,
        gridRow: segment.lane + 1,
      }}
      title={getEventTitle(segment.event)}
    >
      {segment.isStart ? getEventTitle(segment.event) : ""}
    </button>
  );
}
