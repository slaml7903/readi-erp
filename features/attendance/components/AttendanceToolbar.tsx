import { Button, Input } from "@/components/ui";
import { parseMultiValue, serializeMultiValue } from "@/lib/data";
import { addMonths, getTodayDate } from "@/lib/date";

import { formatMonthLabel } from "../utils/attendance-calendar";

type MultiSelectFilterProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
};

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) {
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

type AttendanceToolbarProps = {
  selectedMonth: string;
  department: string;
  type: string;
  employeeSearch: string;
  departments: string[];
  attendanceTypes: string[];
  onEmployeeSearchChange: (value: string) => void;
  onMoveTo: (params: {
    month?: string;
    department?: string;
    type?: string;
    employee?: string;
  }) => void;
  onResetFilters: () => void;
  onOpenRequest: () => void;
};

export default function AttendanceToolbar({
  selectedMonth,
  department,
  type,
  employeeSearch,
  departments,
  attendanceTypes,
  onEmployeeSearchChange,
  onMoveTo,
  onResetFilters,
  onOpenRequest,
}: AttendanceToolbarProps) {
  const today = getTodayDate();
  const selectedDepartments = parseMultiValue(department);
  const selectedTypes = parseMultiValue(type);

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onMoveTo({ month: today.slice(0, 7) })}
        >
          오늘
        </Button>
        <Button
          variant="outline"
          className="w-10 px-0"
          onClick={() => onMoveTo({ month: addMonths(selectedMonth, -1) })}
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
          onClick={() => onMoveTo({ month: addMonths(selectedMonth, 1) })}
          aria-label="다음 달"
        >
          &gt;
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <MultiSelectFilter
          label="전체 부서"
          options={departments}
          selected={selectedDepartments}
          onChange={(nextSelected) =>
            onMoveTo({ department: serializeMultiValue(nextSelected) })
          }
        />
        <MultiSelectFilter
          label="전체 유형"
          options={attendanceTypes}
          selected={selectedTypes}
          onChange={(nextSelected) =>
            onMoveTo({ type: serializeMultiValue(nextSelected) })
          }
        />
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onMoveTo({ employee: employeeSearch.trim() });
          }}
        >
          <Input
            value={employeeSearch}
            onChange={(event) => onEmployeeSearchChange(event.target.value)}
            placeholder="직원 검색"
            className="w-44"
          />
          <Button variant="secondary" type="submit">
            검색
          </Button>
        </form>
        <Button variant="outline" onClick={onResetFilters}>
          초기화
        </Button>
        <Button type="button" onClick={onOpenRequest}>
          신청
        </Button>
      </div>
    </div>
  );
}
