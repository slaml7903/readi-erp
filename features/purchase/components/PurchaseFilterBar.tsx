"use client";

import { Button, Input, Select } from "@/components/ui";

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
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="PR NO. / 제목 / 팀명 / 요청자 / 프로젝트 / 벤더 / 상태 검색"
          className="w-72"
        />

        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">전체 상태</option>
          <option value="요청됨">요청됨</option>
          <option value="승인완료">승인완료</option>
          <option value="보류">보류</option>
          <option value="반려">반려</option>
          <option value="취소">취소</option>
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
