"use client";

import { useMemo, useState } from "react";

import { Button, Drawer } from "@/components/ui";
import { formatDate } from "@/lib/date";

import type {
  SummaryCardKey,
} from "../types/attendance-calendar.type";
import type {
  AttendanceDashboardData,
  AttendanceEvent,
} from "../types/attendance.type";
import {
  getAttendanceTypeOrder,
  getDetailPeriod,
  getDetailType,
  getEventTitle,
  getTypeGroupLabel,
} from "../utils/attendance-event";

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 border-b border-gray-100 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
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

export function getSummaryCardTitle(cardKey: SummaryCardKey) {
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

export function AttendanceSelectedEventDrawer({
  event,
  returnDate,
  onBackToDate,
  onClose,
}: {
  event: AttendanceEvent | null;
  returnDate: string | null;
  onBackToDate: () => void;
  onClose: () => void;
}) {
  return (
    <Drawer open={Boolean(event)} title="근태 상세" onClose={onClose}>
      {event && (
        <div className="space-y-4">
          {returnDate && (
            <Button type="button" variant="outline" onClick={onBackToDate}>
              근태목록으로
            </Button>
          )}
          <EventDetail event={event} />
        </div>
      )}
    </Drawer>
  );
}

export function AttendanceGroupedEventsDrawer({
  events,
  onClose,
}: {
  events: AttendanceEvent[] | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={Boolean(events)}
      title="유연근무 전체 조회"
      onClose={onClose}
      width="w-[720px]"
    >
      <EventTable events={events ?? []} />
    </Drawer>
  );
}

export function AttendanceSummaryDrawer({
  data,
  selectedSummaryCard,
  onClose,
}: {
  data: AttendanceDashboardData;
  selectedSummaryCard: SummaryCardKey | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={Boolean(selectedSummaryCard)}
      title={
        selectedSummaryCard
          ? `${getSummaryCardTitle(selectedSummaryCard)} 현황`
          : "현황"
      }
      onClose={onClose}
      width="w-[760px]"
    >
      {selectedSummaryCard && (
        <SummaryTable data={data} cardKey={selectedSummaryCard} />
      )}
    </Drawer>
  );
}

export function AttendanceDateEventsDrawer({
  selectedDate,
  events,
  onSelectEvent,
  onClose,
}: {
  selectedDate: string | null;
  events: AttendanceEvent[];
  onSelectEvent: (event: AttendanceEvent) => void;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={Boolean(selectedDate)}
      title={`${selectedDate ? formatDate(selectedDate) : ""} 근태 목록`}
      onClose={onClose}
    >
      <DateEventGroups
        key={selectedDate}
        events={events}
        onSelectEvent={onSelectEvent}
      />
    </Drawer>
  );
}
