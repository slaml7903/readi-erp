"use client";

import { SearchInput, Select } from "@/components/ui";
import type { InventoryStockStatus } from "../types/inventory.type";

type InventoryFilterBarProps = {
  search: string;
  status: InventoryStockStatus | "";
  department: string;
  departments: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: InventoryStockStatus | "") => void;
  onDepartmentChange: (value: string) => void;
};

export default function InventoryFilterBar({
  search,
  status,
  department,
  departments,
  onSearchChange,
  onStatusChange,
  onDepartmentChange,
}: InventoryFilterBarProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)] md:grid-cols-[minmax(260px,1fr)_180px_180px]">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="품목코드, 품명, 규격, 거래처, 관리부서 검색"
        className="w-full"
      />
      <Select
        aria-label="재고상태"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as InventoryStockStatus | "")
        }
      >
        <option value="">전체 재고상태</option>
        <option value="정상">정상</option>
        <option value="발주필요">발주필요</option>
        <option value="품절">품절</option>
        <option value="재고오류">재고오류</option>
        <option value="기준미설정">기준미설정</option>
      </Select>
      <Select
        aria-label="관리부서"
        value={department}
        onChange={(event) => onDepartmentChange(event.target.value)}
      >
        <option value="">전체 관리부서</option>
        {departments.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </Select>
    </div>
  );
}
