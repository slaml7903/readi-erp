import { airtableCreateRecord, airtableFetchAll } from "@/lib/airtable/client";
import {
  removeEmptyFields,
  toAirtableDateOnly,
  toAirtableFirstString,
  toAirtableLinkedRecordIds,
  toAirtableString,
} from "@/lib/airtable/record";
import { extractTime } from "@/lib/date";

import {
  ATTENDANCE_BASE_ID,
  ATTENDANCE_FIELDS,
  ATTENDANCE_TABLES,
} from "../config/attendance.config";
import { getMonthRange, getTodayDate } from "@/lib/date";
import type {
  AttendanceEmployee,
  AttendanceEvent,
  CreateAttendanceRequestInput,
} from "../types/attendance.type";
import {
  ATTENDANCE_EMPLOYEES_TAG,
  getAffectedAttendanceMonths,
  getAttendanceEventsTag,
  getAttendanceTodayTag,
  isDateInRange,
} from "../utils/attendance-cache";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

const ATTENDANCE_RANGED_TYPES = ["연차", "출장"] as const;

function createEmployeeMap(records: AirtableRecord[]) {
  const map = new Map<string, AttendanceEmployee>();

  records.forEach((record) => {
    const fields = record.fields;

    map.set(record.id, {
      id: record.id,
      name: toAirtableString(fields[ATTENDANCE_FIELDS.employeeName]),
      department: toAirtableString(fields[ATTENDANCE_FIELDS.employeeDepartment]),
      position: toAirtableString(fields[ATTENDANCE_FIELDS.employeePosition]),
      status: toAirtableString(fields[ATTENDANCE_FIELDS.employeeStatus]),
    });
  });

  return map;
}

function isRangedType(type: string) {
  return ATTENDANCE_RANGED_TYPES.includes(
    type as (typeof ATTENDANCE_RANGED_TYPES)[number]
  );
}

function airtableField(fieldName: string) {
  return `{${fieldName.replaceAll("}", "\\}")}}`;
}

function airtableString(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function createRangedTypeFormula() {
  return `OR(${ATTENDANCE_RANGED_TYPES.map(
    (type) =>
      `${airtableField(ATTENDANCE_FIELDS.attendanceType)}=${airtableString(type)}`
  ).join(",")})`;
}

function createMonthlyAttendanceFormula(month: string) {
  const { start, end } = getMonthRange(month);
  const startField = airtableField(ATTENDANCE_FIELDS.startDate);
  const endField = airtableField(ATTENDANCE_FIELDS.endDate);
  const rangedTypeFormula = createRangedTypeFormula();
  const monthStart = `DATETIME_PARSE(${airtableString(start)})`;
  const monthEnd = `DATETIME_PARSE(${airtableString(end)})`;

  return `OR(AND(${rangedTypeFormula},IS_BEFORE(${startField},DATEADD(${monthEnd},1,"day")),IS_AFTER(IF(${endField},${endField},${startField}),DATEADD(${monthStart},-1,"day"))),AND(NOT(${rangedTypeFormula}),IS_AFTER(${startField},DATEADD(${monthStart},-1,"day")),IS_BEFORE(${startField},DATEADD(${monthEnd},1,"day"))))`;
}

function createDailyAttendanceFormula(date: string) {
  const startField = airtableField(ATTENDANCE_FIELDS.startDate);
  const endField = airtableField(ATTENDANCE_FIELDS.endDate);
  const rangedTypeFormula = createRangedTypeFormula();
  const targetDate = `DATETIME_PARSE(${airtableString(date)})`;

  return `OR(AND(${rangedTypeFormula},IS_BEFORE(${startField},DATEADD(${targetDate},1,"day")),IS_AFTER(IF(${endField},${endField},${startField}),DATEADD(${targetDate},-1,"day"))),AND(NOT(${rangedTypeFormula}),IS_SAME(${startField},${targetDate},"day")))`;
}

function normalizeAttendanceType(value: unknown) {
  const type = toAirtableString(value).replace(/\s+/g, " ");

  if (type.includes("연차")) return "연차";
  if (type.includes("출장")) return "출장";
  if (type.includes("오전") && type.includes("반차")) return "오전 반차";
  if (type.includes("오후") && type.includes("반차")) return "오후 반차";
  if (type.includes("유연근무")) return "유연근무";
  if (type.includes("외근")) return "외근";

  return type;
}

function normalizeAttendanceRecord(
  record: AirtableRecord,
  employeeMap: Map<string, AttendanceEmployee>
): AttendanceEvent | undefined {
  const fields = record.fields;
  const attendanceType = normalizeAttendanceType(
    fields[ATTENDANCE_FIELDS.attendanceType]
  );
  const startDate = toAirtableDateOnly(fields[ATTENDANCE_FIELDS.startDate]);

  if (!startDate) return undefined;

  const requesterId =
    toAirtableLinkedRecordIds(fields[ATTENDANCE_FIELDS.requester])[0] ?? null;
  const employee = requesterId ? employeeMap.get(requesterId) : undefined;
  const rawEndDate = toAirtableDateOnly(fields[ATTENDANCE_FIELDS.endDate]);
  const endDate = isRangedType(attendanceType) ? rawEndDate || startDate : startDate;

  return {
    id: record.id,
    requestNumber: toAirtableString(fields[ATTENDANCE_FIELDS.requestNumber]),
    employeeId: requesterId,
    employeeName:
      employee?.name ||
      toAirtableFirstString(fields[ATTENDANCE_FIELDS.requester]) ||
      "직원 정보 없음",
    department: employee?.department ?? "",
    position: employee?.position ?? "",
    attendanceType,
    flexibleWorkType:
      attendanceType === "유연근무"
        ? toAirtableString(fields[ATTENDANCE_FIELDS.flexibleWorkType])
        : "",
    location:
      attendanceType === "출장"
        ? toAirtableString(fields[ATTENDANCE_FIELDS.location])
        : "",
    purpose:
      attendanceType === "연차" || attendanceType === "출장"
        ? toAirtableString(fields[ATTENDANCE_FIELDS.purpose])
        : "",
    startDate,
    endDate,
    outsideWorkTime:
      attendanceType === "외근"
        ? extractTime(
            toAirtableString(fields[ATTENDANCE_FIELDS.outsideWorkDateTime])
          )
        : "",
    createdAt:
      toAirtableString(fields[ATTENDANCE_FIELDS.createdAt]) ||
      record.createdTime ||
      "",
    hasDateError: Boolean(endDate && endDate < startDate),
  };
}

export async function getAttendanceEmployees(): Promise<AttendanceEmployee[]> {
  const records = await airtableFetchAll(ATTENDANCE_TABLES.master, {
    baseId: ATTENDANCE_BASE_ID,
    cache: "force-cache",
    revalidate: 300,
    tags: [ATTENDANCE_EMPLOYEES_TAG],
  });

  return records.map((record) => {
    const fields = record.fields;

    return {
      id: record.id,
      name: toAirtableString(fields[ATTENDANCE_FIELDS.employeeName]),
      department: toAirtableString(fields[ATTENDANCE_FIELDS.employeeDepartment]),
      position: toAirtableString(fields[ATTENDANCE_FIELDS.employeePosition]),
      status: toAirtableString(fields[ATTENDANCE_FIELDS.employeeStatus]),
    };
  });
}

async function getAttendanceEventsByFormula({
  filterByFormula,
  revalidate,
  tags,
}: {
  filterByFormula: string;
  revalidate: number;
  tags: string[];
}): Promise<AttendanceEvent[]> {
  const [employeeRecords, requestRecords] = await Promise.all([
    airtableFetchAll(ATTENDANCE_TABLES.master, {
      baseId: ATTENDANCE_BASE_ID,
      cache: "force-cache",
      revalidate: 300,
      tags: [ATTENDANCE_EMPLOYEES_TAG],
    }),
    airtableFetchAll(ATTENDANCE_TABLES.requests, {
      baseId: ATTENDANCE_BASE_ID,
      cache: "force-cache",
      revalidate,
      tags,
      filterByFormula,
    }),
  ]);

  const employeeMap = createEmployeeMap(employeeRecords);

  return requestRecords
    .map((record) => normalizeAttendanceRecord(record, employeeMap))
    .filter((event): event is AttendanceEvent => Boolean(event));
}

export async function getAttendanceEventsByMonth(
  month: string
): Promise<AttendanceEvent[]> {
  return await getAttendanceEventsByFormula({
    filterByFormula: createMonthlyAttendanceFormula(month),
    revalidate: 60,
    tags: [getAttendanceEventsTag(month)],
  });
}

export async function getAttendanceEventsByDate(
  date: string
): Promise<AttendanceEvent[]> {
  return await getAttendanceEventsByFormula({
    filterByFormula: createDailyAttendanceFormula(date),
    revalidate: 60,
    tags: [getAttendanceTodayTag(date)],
  });
}

export async function getAttendanceEvents(
  month: string
): Promise<AttendanceEvent[]> {
  return await getAttendanceEventsByMonth(month);
}

export async function createAttendanceRequest(
  input: CreateAttendanceRequestInput
) {
  const today = getTodayDate();
  const affectedMonths = getAffectedAttendanceMonths(
    input.startDate,
    input.endDate || input.startDate
  );
  const revalidateTags = affectedMonths.map(getAttendanceEventsTag);

  if (isDateInRange(today, input.startDate, input.endDate || input.startDate)) {
    revalidateTags.push(getAttendanceTodayTag(today));
  }

  return await airtableCreateRecord(
    ATTENDANCE_TABLES.requests,
    removeEmptyFields({
      [ATTENDANCE_FIELDS.requester]: [input.employeeId],
      [ATTENDANCE_FIELDS.attendanceType]: input.attendanceType,
      [ATTENDANCE_FIELDS.flexibleWorkType]: input.flexibleWorkType,
      [ATTENDANCE_FIELDS.location]: input.location,
      [ATTENDANCE_FIELDS.purpose]: input.purpose,
      [ATTENDANCE_FIELDS.outsideWorkDateTime]: input.outsideWorkDateTime,
      [ATTENDANCE_FIELDS.startDate]: input.startDate,
      [ATTENDANCE_FIELDS.endDate]: input.endDate,
    }),
    {
      baseId: ATTENDANCE_BASE_ID,
      typecast: true,
      revalidateTags,
    }
  );
}

export const attendanceAirtableMapping = {
  baseId: ATTENDANCE_BASE_ID,
  tables: ATTENDANCE_TABLES,
  fields: ATTENDANCE_FIELDS,
};
