"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AttachmentCell, Button, DataTable, SearchInput, type DataTableColumn } from "@/components/ui";
import type { VendorListItem } from "../../types/vendor.type";

const columns: DataTableColumn<VendorListItem>[] = [
  { key: "name", header: "거래처명", sortable: true, width: "20%" },
  { key: "manager", header: "담당자", sortable: true, width: "11%" },
  { key: "phone", header: "연락처", width: "15%" },
  { key: "email", header: "이메일", width: "20%" },
  {
    key: "businessRegistrationAttachments",
    header: "사업자등록증",
    width: "13%",
    render: (vendor) => <AttachmentCell files={vendor.businessRegistrationAttachments} label="사업자등록증" />,
  },
  {
    key: "bankbookAttachments",
    header: "통장사본",
    width: "13%",
    render: (vendor) => <AttachmentCell files={vendor.bankbookAttachments} label="통장사본" />,
  },
];

export default function VendorListClient({
  vendors,
  initialSearch,
}: {
  vendors: VendorListItem[];
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/purchase/vendors?q=${encodeURIComponent(query)}` : "/purchase/vendors");
  };

  const handleReset = () => {
    setSearch("");
    router.push("/purchase/vendors");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)]">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-wrap gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="거래처명 또는 담당자 검색"
            className="w-full max-w-xl"
          />
          <Button type="submit">검색</Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            초기화
          </Button>
        </form>

      </div>

      <DataTable
        tableId="purchase-vendors"
        columns={columns}
        data={vendors}
        getRowId={(vendor) => vendor.id}
        onRowClick={(vendor) => router.push(`/purchase/vendors/${vendor.id}`)}
        getRowAriaLabel={(vendor) => `${vendor.name} 거래처 상세보기`}
        emptyMessage="조건에 맞는 거래처가 없습니다."
      />
    </div>
  );
}
