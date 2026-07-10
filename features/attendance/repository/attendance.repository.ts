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
import type {
  AttendanceEmployee,
  AttendanceEvent,
  CreateAttendanceRequestInput,
} from "../types/attendance.type";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

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
  return type === "연차" || type === "출장";
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
    cache: "no-store",
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

export async function getAttendanceEvents(): Promise<AttendanceEvent[]> {
  const [employeeRecords, requestRecords] = await Promise.all([
    airtableFetchAll(ATTENDANCE_TABLES.master, {
      baseId: ATTENDANCE_BASE_ID,
      cache: "no-store",
    }),
    airtableFetchAll(ATTENDANCE_TABLES.requests, {
      baseId: ATTENDANCE_BASE_ID,
      cache: "no-store",
    }),
  ]);

  const employeeMap = createEmployeeMap(employeeRecords);

  return requestRecords
    .map((record) => normalizeAttendanceRecord(record, employeeMap))
    .filter((event): event is AttendanceEvent => Boolean(event));
}

export async function createAttendanceRequest(
  input: CreateAttendanceRequestInput
) {
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
    }
  );
}

export const attendanceAirtableMapping = {
  baseId: ATTENDANCE_BASE_ID,
  tables: ATTENDANCE_TABLES,
  fields: ATTENDANCE_FIELDS,
};
