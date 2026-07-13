"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getTodayDate } from "@/lib/date";
import { createQueryString } from "@/lib/query";

import type { SummaryCardKey } from "../types/attendance-calendar.type";
import type {
  AttendanceDashboardData,
  AttendanceEvent,
} from "../types/attendance.type";
import AttendanceCalendarGrid from "./AttendanceCalendarGrid";
import {
  AttendanceDateEventsDrawer,
  AttendanceGroupedEventsDrawer,
  AttendanceSelectedEventDrawer,
  AttendanceSummaryDrawer,
} from "./AttendanceEventDetailDrawer";
import AttendanceRequestDrawer from "./AttendanceRequestDrawer";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceToolbar from "./AttendanceToolbar";
import { createCalendarWeeks } from "../utils/attendance-calendar";
import { createHolidayMap } from "../utils/attendance-holiday";
import { getEventsForDate } from "../utils/attendance-event";

type AttendanceCalendarClientProps = {
  data: AttendanceDashboardData;
  selectedMonth: string;
  department: string;
  type: string;
  employee: string;
};

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
  const [requestFormKey, setRequestFormKey] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState(employee);
  const today = getTodayDate();

  const weeks = useMemo(
    () => createCalendarWeeks(selectedMonth),
    [selectedMonth]
  );
  const holidayMap = useMemo(
    () => createHolidayMap(selectedMonth),
    [selectedMonth]
  );
  const selectedDateEvents = selectedDate
    ? getEventsForDate(data.events, selectedDate)
    : [];

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

  function selectEvent(event: AttendanceEvent) {
    setReturnDate(null);
    setSelectedEvent(event);
  }

  function selectEventFromDate(event: AttendanceEvent) {
    setReturnDate(selectedDate);
    setSelectedDate(null);
    setSelectedEvent(event);
  }

  return (
    <div className="space-y-5">
      <AttendanceSummaryCards
        summary={data.summary}
        onSelectCard={setSelectedSummaryCard}
      />

      <AttendanceToolbar
        selectedMonth={selectedMonth}
        department={department}
        type={type}
        employeeSearch={employeeSearch}
        departments={data.filterOptions.departments}
        attendanceTypes={data.filterOptions.types}
        onEmployeeSearchChange={setEmployeeSearch}
        onMoveTo={moveTo}
        onResetFilters={resetFilters}
        onOpenRequest={() => setRequestDrawerOpen(true)}
      />

      <AttendanceCalendarGrid
        weeks={weeks}
        events={data.events}
        holidayMap={holidayMap}
        today={today}
        onSelectDate={setSelectedDate}
        onSelectEvent={selectEvent}
        onSelectGroup={setGroupedEvents}
      />

      <AttendanceSelectedEventDrawer
        event={selectedEvent}
        returnDate={returnDate}
        onBackToDate={() => {
          setSelectedEvent(null);
          setSelectedDate(returnDate);
          setReturnDate(null);
        }}
        onClose={() => {
          setSelectedEvent(null);
          setReturnDate(null);
        }}
      />

      <AttendanceRequestDrawer
        open={requestDrawerOpen}
        employees={data.summaryDetails.activeEmployees}
        formKey={requestFormKey}
        onClose={() => setRequestDrawerOpen(false)}
        onSuccess={() => {
          router.refresh();
          setRequestDrawerOpen(false);
          setRequestFormKey((previous) => previous + 1);
        }}
      />

      <AttendanceGroupedEventsDrawer
        events={groupedEvents}
        onClose={() => setGroupedEvents(null)}
      />

      <AttendanceSummaryDrawer
        data={data}
        selectedSummaryCard={selectedSummaryCard}
        onClose={() => setSelectedSummaryCard(null)}
      />

      <AttendanceDateEventsDrawer
        selectedDate={selectedDate}
        events={selectedDateEvents}
        onSelectEvent={selectEventFromDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
