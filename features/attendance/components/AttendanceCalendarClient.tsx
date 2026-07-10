"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button, Drawer, Input, Select } from "@/components/ui";
import { parseMultiValue, serializeMultiValue } from "@/lib/data";
import { addMonths, formatDate, getTodayDate, toDateKey } from "@/lib/date";
import { createQueryString } from "@/lib/query";

import {
  ATTENDANCE_DISPLAY,
  ATTENDANCE_REQUEST_TYPES,
  ATTENDANCE_TYPE_CONFIG,
  DEFAULT_ATTENDANCE_TYPE_STYLE,
  FLEXIBLE_WORK_OPTIONS,
  MOVABLE_KOREAN_HOLIDAYS_BY_YEAR,
} from "../config/attendance.constants";
import type {
  AttendanceDashboardData,
  AttendanceEmployee,
  AttendanceEvent,
  CreateAttendanceRequestInput,
} from "../types/attendance.type";

type AttendanceCalendarClientProps = {
  data: AttendanceDashboardData;
  selectedMonth: string;
  department: string;
  type: string;
  employee: string;
};

type CalendarDay = {
  date: string;
  dayNumber: number;
  inMonth: boolean;
};

type CalendarWeek = {
  days: CalendarDay[];
  startDate: string;
  endDate: string;
};

type Holiday = {
  date: string;
  name: string;
};

type RangedEventSegment = {
  event: AttendanceEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  isStart: boolean;
};

type FlexibleWorkGroup = {
  kind: "flexibleGroup";
  date: string;
  events: AttendanceEvent[];
};

type SingleCalendarItem =
  | { kind: "event"; event: AttendanceEvent }
  | FlexibleWorkGroup;

type SummaryCardKey =
  | "all"
  | "businessTrip"
  | "outsideWork"
  | "morningHalfDay"
  | "afternoonHalfDay"
  | "annualLeave";

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

function createCalendarWeeks(month: string): CalendarWeek[] {
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

function createHolidayMap(month: string) {
  const year = Number(month.slice(0, 4));
  const holidays = [
    ...getFixedSolarHolidays(year),
    ...(MOVABLE_KOREAN_HOLIDAYS_BY_YEAR[year] ?? []),
  ];

  return new Map(holidays.map((holiday) => [holiday.date, holiday]));
}

function isRangedEvent(event: AttendanceEvent) {
  return event.attendanceType === "연차" || event.attendanceType === "출장";
}

function getEventDuration(event: AttendanceEvent) {
  return event.endDate.localeCompare(event.startDate);
}

function getEventsForDate(events: AttendanceEvent[], date: string) {
  return events.filter((event) => event.startDate <= date && event.endDate >= date);
}

function getEventTitle(event: AttendanceEvent) {
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

function getEventStyle(type: string) {
  return ATTENDANCE_TYPE_CONFIG[type]?.style ?? DEFAULT_ATTENDANCE_TYPE_STYLE;
}

function getSingleItemOrder(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") {
    return ATTENDANCE_TYPE_CONFIG["유연근무"]?.singleOrder ?? 99;
  }

  return ATTENDANCE_TYPE_CONFIG[item.event.attendanceType]?.singleOrder ?? 99;
}

function getAttendanceTypeOrder(type: string) {
  return ATTENDANCE_TYPE_CONFIG[type]?.order ?? 99;
}

function getSingleItemTitle(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") {
    return `유연근무 ${item.events.length}명`;
  }

  return getEventTitle(item.event);
}

function getSingleItemStyle(item: SingleCalendarItem) {
  if (item.kind === "flexibleGroup") return getEventStyle("유연근무");
  return getEventStyle(item.event.attendanceType);
}

function createSingleItems(events: AttendanceEvent[], date: string): SingleCalendarItem[] {
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

function sortRangedEvents(events: AttendanceEvent[]) {
  return [...events].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    const durationOrder = getEventDuration(b) - getEventDuration(a);
    if (durationOrder !== 0) return durationOrder;
    return a.employeeName.localeCompare(b.employeeName, "ko");
  });
}

function getTypeGroupLabel(type: string) {
  if (type === "오전 반차" || type === "오후 반차") return "반차";
  return type || "기타";
}

function createRangedEventSegments(
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

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 border-b border-gray-100 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function getDetailType(event: AttendanceEvent) {
  if (event.attendanceType === "유연근무" && event.flexibleWorkType) {
    return `${event.attendanceType} · ${event.flexibleWorkType}`;
  }

  return event.attendanceType || "기타";
}

function getDetailPeriod(event: AttendanceEvent) {
  if (!event.startDate) return "";
  if (!event.endDate || event.startDate === event.endDate) {
    return formatDate(event.startDate);
  }

  return `${formatDate(event.startDate)} ~ ${formatDate(event.endDate)}`;
}

function EventDetail({ event }: { event: AttendanceEvent }) {
  return (
    <dl>
      <DetailRow label="신청자" value={event.employeeName} />
      <DetailRow label="부서" value={event.department} />
      <DetailRow label="유형" value={getDetailType(event)} />
      <DetailRow label="기간" value={getDetailPeriod(event)} />
      <DetailRow label="장소" value={event.location} />
      <DetailRow label="사유/목적" value={event.purpose} />
    </dl>
  );
}

function getSummaryEvents(data: AttendanceDashboardData, cardKey: SummaryCardKey) {
  if (cardKey === "all") return [];

  const typeByCardKey: Record<Exclude<SummaryCardKey, "all">, string> = {
    businessTrip: "출장",
    outsideWork: "외근",
    morningHalfDay: "오전 반차",
    afternoonHalfDay: "오후 반차",
    annualLeave: "연차",
  };

  return data.summaryDetails.todayEvents.filter(
    (event) => event.attendanceType === typeByCardKey[cardKey]
  );
}

function getSummaryCardTitle(cardKey: SummaryCardKey) {
  const titleMap: Record<SummaryCardKey, string> = {
    all: "전체",
    businessTrip: "출장",
    outsideWork: "외근",
    morningHalfDay: "오전반차",
    afternoonHalfDay: "오후반차",
    annualLeave: "연차",
  };

  return titleMap[cardKey];
}

function SummaryTable({
  data,
  cardKey,
}: {
  data: AttendanceDashboardData;
  cardKey: SummaryCardKey;
}) {
  if (cardKey === "all") {
    return (
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">부서</th>
              <th className="px-3 py-2 font-medium">직급</th>
              <th className="px-3 py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {data.summaryDetails.activeEmployees.map((employee) => (
              <tr key={employee.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{employee.name}</td>
                <td className="px-3 py-2 text-gray-700">{employee.department}</td>
                <td className="px-3 py-2 text-gray-700">{employee.position}</td>
                <td className="px-3 py-2 text-gray-700">{employee.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const events = getSummaryEvents(data, cardKey);

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-2 font-medium">신청자</th>
            <th className="px-3 py-2 font-medium">부서</th>
            <th className="px-3 py-2 font-medium">유형</th>
            <th className="px-3 py-2 font-medium">기간</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>
                오늘 해당 데이터가 없습니다.
              </td>
            </tr>
          )}
          {events.map((event) => (
            <tr key={event.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-900">
                {event.employeeName}
              </td>
              <td className="px-3 py-2 text-gray-700">{event.department}</td>
              <td className="px-3 py-2 text-gray-700">{getDetailType(event)}</td>
              <td className="px-3 py-2 text-gray-700">{getDetailPeriod(event)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventTable({ events }: { events: AttendanceEvent[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-2 font-medium">신청자</th>
            <th className="px-3 py-2 font-medium">부서</th>
            <th className="px-3 py-2 font-medium">유형</th>
            <th className="px-3 py-2 font-medium">기간</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
          {events.map((event) => (
            <tr key={event.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-900">
                {event.employeeName}
              </td>
              <td className="px-3 py-2 text-gray-700">{event.department}</td>
              <td className="px-3 py-2 text-gray-700">{getDetailType(event)}</td>
              <td className="px-3 py-2 text-gray-700">{getDetailPeriod(event)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DateEventGroups({
  events,
  onSelectEvent,
}: {
  events: AttendanceEvent[];
  onSelectEvent: (event: AttendanceEvent) => void;
}) {
  const groupedEvents = useMemo(() => {
    const groupMap = new Map<string, AttendanceEvent[]>();

    events.forEach((event) => {
      const key = getTypeGroupLabel(event.attendanceType);
      groupMap.set(key, [...(groupMap.get(key) ?? []), event]);
    });

    return Array.from(groupMap.entries())
      .map(([type, typeEvents]) => ({
        type,
        events: typeEvents.sort((a, b) => {
          if (type === "유연근무") {
            const timeOrder = a.flexibleWorkType.localeCompare(
              b.flexibleWorkType,
              "ko",
              { numeric: true }
            );

            if (timeOrder !== 0) return timeOrder;
          }

          return a.employeeName.localeCompare(b.employeeName, "ko");
        }),
      }))
      .sort((a, b) => {
        const typeOrder =
          getAttendanceTypeOrder(a.type) - getAttendanceTypeOrder(b.type);
        if (typeOrder !== 0) return typeOrder;
        return a.type.localeCompare(b.type, "ko");
      });
  }, [events]);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    () => new Set(groupedEvents.map((group) => group.type))
  );

  function toggleType(type: string) {
    setExpandedTypes((previous) => {
      const next = new Set(previous);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });
  }

  if (events.length === 0) {
    return <p className="text-sm text-gray-500">등록된 근태 일정이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {groupedEvents.map((group) => {
        const expanded = expandedTypes.has(group.type);

        return (
          <section
            key={group.type}
            className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleType(group.type)}
              className="flex w-full items-center justify-between border-b border-gray-200 bg-slate-100 px-4 py-3 text-left text-base font-bold text-gray-950"
            >
              <span>{group.type}</span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                {group.events.length}건 {expanded ? "접기" : "펼치기"}
              </span>
            </button>

            {expanded && (
              <div className="divide-y divide-gray-200 bg-white">
                {group.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {getEventTitle(event)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {[
                        event.department,
                        getDetailPeriod(event),
                        event.location ? `장소: ${event.location}` : "",
                        event.purpose ? `사유/목적: ${event.purpose}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RequiredMark() {
  return <span className="ml-1 font-bold text-blue-700">*</span>;
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] overflow-visible border-b border-gray-200 last:border-b-0">
      <div className="flex items-center bg-sky-50 px-4 py-3 text-sm font-bold text-gray-900">
        {required && <RequiredMark />}
        <span>{label}</span>
      </div>
      <div className="min-w-0 px-4 py-3">{children}</div>
    </div>
  );
}

function AttendanceRequestForm({
  employees,
  onSuccess,
}: {
  employees: AttendanceEmployee[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateAttendanceRequestInput>({
    employeeId: "",
    attendanceType: "",
    startDate: "",
    endDate: "",
  });
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const employeeSearchRef = useRef<HTMLDivElement | null>(null);
  const [outsideWorkTime, setOutsideWorkTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const isRangedType = form.attendanceType === "연차" || form.attendanceType === "출장";
  const needsLocation = form.attendanceType === "출장";
  const needsPurpose = form.attendanceType === "연차" || form.attendanceType === "출장";
  const needsOutsideWorkDateTime = form.attendanceType === "외근";
  const needsFlexibleWorkType = form.attendanceType === "유연근무";
  const filteredEmployees = employees
    .filter((employee) => {
      const query = employeeQuery.trim().toLowerCase();

      if (!query) return true;

      return getEmployeeLabel(employee).toLowerCase().includes(query);
    })
    .slice(0, 8);

  useEffect(() => {
    function closeSearchOnOutsideClick(event: MouseEvent) {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(event.target as Node)
      ) {
        setEmployeeSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", closeSearchOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeSearchOnOutsideClick);
    };
  }, []);

  function updateForm<K extends keyof CreateAttendanceRequestInput>(
    key: K,
    value: CreateAttendanceRequestInput[K]
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function getEmployeeLabel(employee: AttendanceEmployee) {
    return [employee.name, employee.department, employee.position]
      .filter(Boolean)
      .join(" · ");
  }

  function findSelectedEmployee() {
    const query = employeeQuery.trim();

    return employees.find(
      (employee) =>
        getEmployeeLabel(employee) === query || employee.name.trim() === query
    );
  }

  function selectEmployee(employee: AttendanceEmployee) {
    setEmployeeQuery(getEmployeeLabel(employee));
    updateForm("employeeId", employee.id);
    setEmployeeSearchOpen(false);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const selectedEmployee = findSelectedEmployee();

      if (!selectedEmployee) {
        throw new Error("신청자를 직원 목록에서 선택해 주세요.");
      }

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          employeeId: selectedEmployee.id,
          endDate: isRangedType ? form.endDate || form.startDate : "",
          outsideWorkDateTime:
            needsOutsideWorkDateTime && form.startDate && outsideWorkTime
              ? `${form.startDate}T${outsideWorkTime}:00+09:00`
              : "",
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "근태 신청 등록에 실패했습니다.");
      }

      setMessage(result.message ?? "근태 신청이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "근태 신청 등록 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submitForm}>
      <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
        입력하신 정보는 근태 신청 등록 목적으로만 사용됩니다. 필수 항목을
        확인하고 작성해 주세요.
      </p>

      <div className="overflow-visible rounded-lg border border-gray-300 bg-white">
        <FieldRow label="신청자" required>
          <div ref={employeeSearchRef} className="relative">
            <Input
              value={employeeQuery}
              onFocus={() => setEmployeeSearchOpen(true)}
              onChange={(event) => {
                setEmployeeQuery(event.target.value);
                updateForm("employeeId", "");
                setEmployeeSearchOpen(true);
              }}
              placeholder="이름, 부서, 직급으로 검색"
              required
            />
            {employeeSearchOpen && (
              <div className="absolute left-0 right-0 top-11 z-40 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                {filteredEmployees.length === 0 && (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    일치하는 직원이 없습니다.
                  </div>
                )}
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => selectEmployee(employee)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                  >
                    <span className="font-semibold text-gray-900">
                      {employee.name}
                    </span>
                    <span className="ml-2 text-gray-500">
                      {[employee.department, employee.position]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FieldRow>

        <FieldRow label="유형" required>
          <Select
            value={form.attendanceType}
            onChange={(event) => {
              updateForm("attendanceType", event.target.value);
              updateForm("flexibleWorkType", "");
              updateForm("location", "");
              updateForm("purpose", "");
              updateForm("outsideWorkDateTime", "");
              setOutsideWorkTime("");
            }}
            className="w-full"
            required
          >
            <option value="">선택</option>
            {ATTENDANCE_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FieldRow>

        <FieldRow label={needsOutsideWorkDateTime ? "외근일" : "시작일"} required>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) => updateForm("startDate", event.target.value)}
            required
          />
        </FieldRow>

        {isRangedType && (
        <FieldRow label="종료일" required={form.attendanceType === "연차"}>
            <Input
              type="date"
              value={form.endDate ?? ""}
              onChange={(event) => updateForm("endDate", event.target.value)}
              required={form.attendanceType === "연차"}
            />
          </FieldRow>
        )}

        {needsFlexibleWorkType && (
          <FieldRow label="유연근무" required>
            <Select
              value={form.flexibleWorkType ?? ""}
              onChange={(event) =>
                updateForm("flexibleWorkType", event.target.value)
              }
              className="w-full"
              required
            >
              <option value="">선택</option>
              {FLEXIBLE_WORK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FieldRow>
        )}

        {needsOutsideWorkDateTime && (
          <FieldRow label="외근 시간" required>
            <Input
              type="time"
              value={outsideWorkTime}
              onChange={(event) => setOutsideWorkTime(event.target.value)}
              required
            />
          </FieldRow>
        )}

        {needsLocation && (
          <FieldRow label="장소" required>
            <Input
              value={form.location ?? ""}
              onChange={(event) => updateForm("location", event.target.value)}
              placeholder="예: 서울시, 경기도"
              required
            />
          </FieldRow>
        )}

        {needsPurpose && (
          <FieldRow label="사유/목적" required>
            <textarea
              value={form.purpose ?? ""}
              onChange={(event) => updateForm("purpose", event.target.value)}
              placeholder="사유 또는 목적을 입력해 주세요."
              required
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
          </FieldRow>
        )}
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "신청 중" : "신청"}
        </Button>
      </div>
    </form>
  );
}

function SummaryButton({
  title,
  value,
  onClick,
}: {
  title: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </button>
  );
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
}) {
  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? selected[0]
        : `${selected[0]} 외 ${selected.length - 1}`;

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }

    onChange([...selected, option]);
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="h-10 min-w-36 rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-gray-900 outline-none hover:bg-gray-50"
      >
        {displayLabel}
      </button>
      <div className="invisible absolute left-0 top-11 z-30 w-56 rounded-md border border-gray-200 bg-white p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onChange([])}
          className="mb-1 w-full rounded px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-50"
        >
          전체
        </button>
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCalendarClient({
  data,
  selectedMonth,
  department,
  type,
  employee,
}: AttendanceCalendarClientProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
  const [groupedEvents, setGroupedEvents] = useState<AttendanceEvent[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [selectedSummaryCard, setSelectedSummaryCard] =
    useState<SummaryCardKey | null>(null);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState(employee);
  const today = getTodayDate();
  const selectedDepartments = parseMultiValue(department);
  const selectedTypes = parseMultiValue(type);

  const weeks = useMemo(
    () => createCalendarWeeks(selectedMonth),
    [selectedMonth]
  );
  const holidayMap = useMemo(
    () => createHolidayMap(selectedMonth),
    [selectedMonth]
  );

  function moveTo(params: {
    month?: string;
    department?: string;
    type?: string;
    employee?: string;
  }) {
    const nextDepartment = params.department ?? department;
    const nextType = params.type ?? type;
    const nextEmployee = params.employee ?? employeeSearch;
    const query = createQueryString({
      month: params.month ?? selectedMonth,
      department: nextDepartment,
      type: nextType,
      employee: nextEmployee,
    });

    router.push(`/management/attendance?${query}`);
  }

  function resetFilters() {
    setEmployeeSearch("");
    router.push(`/management/attendance?month=${selectedMonth}`);
  }

  const selectedDateEvents = selectedDate
    ? getEventsForDate(data.events, selectedDate)
    : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryButton
          title="전체"
          value={data.summary.activeEmployeeCount}
          onClick={() => setSelectedSummaryCard("all")}
        />
        <SummaryButton
          title="출장"
          value={data.summary.businessTripCount}
          onClick={() => setSelectedSummaryCard("businessTrip")}
        />
        <SummaryButton
          title="외근"
          value={data.summary.outsideWorkCount}
          onClick={() => setSelectedSummaryCard("outsideWork")}
        />
        <SummaryButton
          title="오전반차"
          value={data.summary.morningHalfDayCount}
          onClick={() => setSelectedSummaryCard("morningHalfDay")}
        />
        <SummaryButton
          title="오후반차"
          value={data.summary.afternoonHalfDayCount}
          onClick={() => setSelectedSummaryCard("afternoonHalfDay")}
        />
        <SummaryButton
          title="연차"
          value={data.summary.annualLeaveCount}
          onClick={() => setSelectedSummaryCard("annualLeave")}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => moveTo({ month: today.slice(0, 7) })}>
            오늘
          </Button>
          <Button
            variant="outline"
            className="w-10 px-0"
            onClick={() => moveTo({ month: addMonths(selectedMonth, -1) })}
            aria-label="이전 달"
          >
            &lt;
          </Button>
          <div className="min-w-32 text-center text-lg font-semibold text-gray-900">
            {formatMonthLabel(selectedMonth)}
          </div>
          <Button
            variant="outline"
            className="w-10 px-0"
            onClick={() => moveTo({ month: addMonths(selectedMonth, 1) })}
            aria-label="다음 달"
          >
            &gt;
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <MultiSelectFilter
            label="전체 부서"
            options={data.filterOptions.departments}
            selected={selectedDepartments}
            onChange={(nextSelected) =>
              moveTo({ department: serializeMultiValue(nextSelected) })
            }
          />
          <MultiSelectFilter
            label="전체 유형"
            options={data.filterOptions.types}
            selected={selectedTypes}
            onChange={(nextSelected) =>
              moveTo({ type: serializeMultiValue(nextSelected) })
            }
          />
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              moveTo({ employee: employeeSearch.trim() });
            }}
          >
            <Input
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="직원 검색"
              className="w-44"
            />
            <Button variant="secondary" type="submit">
              검색
            </Button>
          </form>
          <Button variant="outline" onClick={resetFilters}>
            초기화
          </Button>
          <Button type="button" onClick={() => setRequestDrawerOpen(true)}>
            신청
          </Button>
        </div>
      </div>

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
          {weeks.map((week) => {
            const rangedSegments = createRangedEventSegments(data.events, week);
            const visibleRangedSegments = rangedSegments.filter(
              (segment) =>
                segment.lane < ATTENDANCE_DISPLAY.maxVisibleRangeLanes
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
                {week.days.map((day, dayIndex) => {
                  const dayEvents = getEventsForDate(data.events, day.date);
                  const singleItems = createSingleItems(
                    dayEvents.filter((event) => !isRangedEvent(event)),
                    day.date
                  );
                  const rangeEventsOnDay = rangedSegments.filter(
                    (segment) =>
                      segment.startIndex <= dayIndex && segment.endIndex >= dayIndex
                  );
                  const hiddenRangeCount = Math.max(
                    rangeEventsOnDay.length -
                      ATTENDANCE_DISPLAY.maxVisibleRangeLanes,
                    0
                  );
                  const visibleSingleCount = Math.max(
                    ATTENDANCE_DISPLAY.maxVisibleEvents -
                      Math.min(
                        rangeEventsOnDay.length,
                        ATTENDANCE_DISPLAY.maxVisibleRangeLanes
                      ),
                    0
                  );
                  const visibleSingleItems = singleItems.slice(0, visibleSingleCount);
                  const hiddenEventCount =
                    hiddenRangeCount +
                    Math.max(singleItems.length - visibleSingleItems.length, 0);
                  const isToday = day.date === today;
                  const holiday = holidayMap.get(day.date);
                  const isHoliday = dayIndex === 0 || Boolean(holiday);

                  return (
                    <div
                      key={day.date}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDate(day.date)}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key === "Enter") {
                          setSelectedDate(day.date);
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
                          <div
                            key={
                              item.kind === "flexibleGroup"
                                ? `flexible-${item.date}`
                                : item.event.id
                            }
                            role="button"
                            tabIndex={0}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              if (item.kind === "flexibleGroup") {
                                setGroupedEvents(item.events);
                              } else {
                                setReturnDate(null);
                                setSelectedEvent(item.event);
                              }
                            }}
                            onKeyDown={(keyEvent) => {
                              if (keyEvent.key === "Enter") {
                                keyEvent.stopPropagation();
                                if (item.kind === "flexibleGroup") {
                                  setGroupedEvents(item.events);
                                } else {
                                  setReturnDate(null);
                                  setSelectedEvent(item.event);
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
                        ))}
                        {hiddenEventCount > 0 && (
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setSelectedDate(day.date);
                            }}
                            className="text-xs font-medium text-gray-500 hover:text-gray-900"
                          >
                            +{hiddenEventCount}개 더보기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pointer-events-none absolute inset-x-0 top-12 grid grid-cols-7 gap-y-1">
                  {visibleRangedSegments.map((segment) => (
                    <button
                      key={`${segment.event.id}-${week.startDate}`}
                      type="button"
                      onClick={() => {
                        setReturnDate(null);
                        setSelectedEvent(segment.event);
                      }}
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedEvent)}
        title="근태 상세"
        onClose={() => {
          setSelectedEvent(null);
          setReturnDate(null);
        }}
      >
        {selectedEvent && (
          <div className="space-y-4">
            {returnDate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedDate(returnDate);
                  setReturnDate(null);
                }}
              >
                근태목록으로
              </Button>
            )}
            <EventDetail event={selectedEvent} />
          </div>
        )}
      </Drawer>

      <Drawer
        open={requestDrawerOpen}
        title="근태 신청"
        onClose={() => setRequestDrawerOpen(false)}
        width="w-[720px]"
      >
        <AttendanceRequestForm
          employees={data.summaryDetails.activeEmployees}
          onSuccess={() => {
            router.refresh();
            setRequestDrawerOpen(false);
          }}
        />
      </Drawer>

      <Drawer
        open={Boolean(groupedEvents)}
        title="유연근무 전체 조회"
        onClose={() => setGroupedEvents(null)}
        width="w-[720px]"
      >
        <EventTable events={groupedEvents ?? []} />
      </Drawer>

      <Drawer
        open={Boolean(selectedSummaryCard)}
        title={
          selectedSummaryCard
            ? `${getSummaryCardTitle(selectedSummaryCard)} 현황`
            : "현황"
        }
        onClose={() => setSelectedSummaryCard(null)}
        width="w-[760px]"
      >
        {selectedSummaryCard && (
          <SummaryTable data={data} cardKey={selectedSummaryCard} />
        )}
      </Drawer>

      <Drawer
        open={Boolean(selectedDate)}
        title={`${selectedDate ? formatDate(selectedDate) : ""} 근태 목록`}
        onClose={() => setSelectedDate(null)}
      >
        <DateEventGroups
          key={selectedDate}
          events={selectedDateEvents}
          onSelectEvent={(event) => {
            setReturnDate(selectedDate);
            setSelectedDate(null);
            setSelectedEvent(event);
          }}
        />
      </Drawer>
    </div>
  );
}
