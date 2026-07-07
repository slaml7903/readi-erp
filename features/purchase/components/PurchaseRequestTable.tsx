import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
} from "@/components/ui";

import type { PurchaseRequest } from "../types/purchase.type";

interface PurchaseRequestTableProps {
  data: PurchaseRequest[];
  selectedRequestId?: string | null;
  onRowClick?: (request: PurchaseRequest) => void;
}

const columns: DataTableColumn<PurchaseRequest>[] = [
  {
    key: "id",
    header: "No.",
    align: "center",
    width: "70px",
    render: (_row, index) => index + 1,
  },
  {
    key: "prNo",
    header: "PR NO.",
    sortable: true,
    width: "150px",
  },
  {
    key: "title",
    header: "제목",
    sortable: true,
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  {
    key: "teamName",
    header: "팀명",
    sortable: true,
    width: "100px",
  },
  {
    key: "requester",
    header: "요청자",
    sortable: true,
    width: "110px",
  },
  {
    key: "status",
    header: "상태",
    sortable: true,
    width: "120px",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "requestDate",
    header: "요청일",
    sortable: true,
    width: "130px",
  },
  {
    key: "totalAmount",
    header: "지출액",
    align: "right",
    sortable: true,
    width: "140px",
    render: (row) => `${row.totalAmount?.toLocaleString() ?? 0}원`,
  },
];

export default function PurchaseRequestTable({
  data,
  selectedRequestId,
  onRowClick,
}: PurchaseRequestTableProps) {
  return (
    <DataTable<PurchaseRequest>
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      selectedRowId={selectedRequestId}
      onRowClick={onRowClick}
    />
  );
}