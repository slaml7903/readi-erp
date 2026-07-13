"use client";

import { Button, SearchInput, Select } from "@/components/ui";

import { PURCHASE_REQUEST_STATUS_OPTIONS } from "../constants/purchase-status";

interface PurchaseFilterBarProps {
  search: string;
  status: string;
  team: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onCreateClick: () => void;
}

export default function PurchaseFilterBar({
  search,
  status,
  team,
  onSearchChange,
  onStatusChange,
  onTeamChange,
  onCreateClick,
}: PurchaseFilterBarProps) {
  const handleReset = () => {
    onSearchChange("");
    onStatusChange("");
    onTeamChange("");
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="구매요청 검색..."
          className="w-72"
        />

        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">전체 상태</option>
          {PURCHASE_REQUEST_STATUS_OPTIONS.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </Select>

        <Select value={team} onChange={(e) => onTeamChange(e.target.value)}>
          <option value="">전체 팀</option>
          <option value="BSC">BSC</option>
          <option value="MSS">MSS</option>
          <option value="EHC">EHC</option>
          <option value="T&P">T&P</option>
        </Select>

        <Button type="button" variant="outline" onClick={handleReset}>
          초기화
        </Button>

        <Button type="button" onClick={onCreateClick}>
          구매요청 등록
        </Button>
      </div>
    </div>
  );
}
