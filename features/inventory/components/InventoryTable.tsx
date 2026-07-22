"use client";

import { DataTable, StatusBadge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { InventoryItem } from "../types/inventory.type";

const columns: DataTableColumn<InventoryItem>[] = [
  { key: "itemCode", header: "품목코드", sortable: true, width: "140px" },
  { key: "itemName", header: "품명", sortable: true, width: "220px" },
  {
    key: "specification",
    header: "규격",
    width: "220px",
    render: (item) => item.specification || "-",
  },
  {
    key: "department",
    header: "관리부서",
    sortable: true,
    width: "130px",
    render: (item) => item.department || "-",
  },
  {
    key: "currentStock",
    header: "현재고",
    align: "right",
    sortable: true,
    width: "100px",
    render: (item) => item.currentStock.toLocaleString("ko-KR"),
  },
  {
    key: "safetyStock",
    header: "안전재고",
    align: "right",
    sortable: true,
    width: "100px",
    render: (item) => item.safetyStock?.toLocaleString("ko-KR") ?? "-",
  },
  {
    key: "status",
    header: "상태",
    align: "center",
    sortable: true,
    width: "110px",
    render: (item) => <StatusBadge status={item.status} />,
  },
];

export default function InventoryTable({
  items,
  selectedItemId,
  onSelect,
}: {
  items: InventoryItem[];
  selectedItemId?: string;
  onSelect: (item: InventoryItem) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="조건에 맞는 품목이 없습니다."
      getRowId={(item) => item.id}
      selectedRowId={selectedItemId}
      onRowClick={onSelect}
    />
  );
}

