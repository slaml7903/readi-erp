"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button, Drawer, Input, Select } from "@/components/ui";

import {
  ATTENDANCE_REQUEST_TYPES,
  FLEXIBLE_WORK_OPTIONS,
} from "../config/attendance.constants";
import type {
  AttendanceEmployee,
  CreateAttendanceRequestInput,
} from "../types/attendance.type";

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

export default function AttendanceRequestDrawer({
  open,
  employees,
  formKey,
  onClose,
  onSuccess,
}: {
  open: boolean;
  employees: AttendanceEmployee[];
  formKey: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <Drawer open={open} title="근태 신청" onClose={onClose} width="w-[720px]">
      <AttendanceRequestForm
        key={formKey}
        employees={employees}
        onSuccess={onSuccess}
      />
    </Drawer>
  );
}
