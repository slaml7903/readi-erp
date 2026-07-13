"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  Button,
  Card,
  DataTable,
  Input,
  Select,
  type DataTableColumn,
} from "@/components/ui";

import {
  PURCHASE_RECEIVING_REVIEW_FILTER,
  PURCHASE_RECEIVING_REVIEW_STATUS,
} from "../../constants/purchase-status";
import type { PurchaseReceivingReviewItem } from "../../types/purchase.type";

type PurchaseReceivingReviewClientProps = {
  data: PurchaseReceivingReviewItem[];
  initialSearch?: string;
};

export default function PurchaseReceivingReviewClient({
  data,
  initialSearch = "",
}: PurchaseReceivingReviewClientProps) {
  const router = useRouter();
  const [selectedReceiving, setSelectedReceiving] =
    useState<PurchaseReceivingReviewItem | null>(data[0] ?? null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [reviewStatus, setReviewStatus] = useState("");

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((receiving) => {
      const keywordMatched =
        !keyword ||
        [
          receiving.receivingNo,
          receiving.poNos?.join(", "),
          receiving.title,
          receiving.receivingChecker,
          receiving.receivingDate,
          receiving.reviewCompleted
            ? PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED
            : PURCHASE_RECEIVING_REVIEW_STATUS.PENDING,
        ].some((value) => value?.toLowerCase().includes(keyword));

      const statusMatched =
        !reviewStatus ||
        (reviewStatus === PURCHASE_RECEIVING_REVIEW_FILTER.COMPLETED &&
          receiving.reviewCompleted) ||
        (reviewStatus === PURCHASE_RECEIVING_REVIEW_FILTER.PENDING &&
          !receiving.reviewCompleted);

      return keywordMatched && statusMatched;
    });
  }, [data, reviewStatus, search]);

  const handleCompleteReview = useCallback(
    async (row: PurchaseReceivingReviewItem) => {
      if (processingId) return;

      if (row.reviewCompleted) {
        alert("이미 검토완료된 입고확인입니다.");
        return;
      }

      const confirmed = window.confirm(
        "검토완료 처리 후 연결된 발주 상태가 입고완료로 변경됩니다. 계속할까요?"
      );

      if (!confirmed) return;

      try {
        setProcessingId(row.id);

        const response = await fetch(
          `/api/purchase/receiving/review/${row.id}`,
          {
            method: "POST",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          alert(result.message ?? "검토완료 처리에 실패했습니다.");
          return;
        }

        alert("검토완료 처리되었습니다.");
        router.refresh();
      } catch (error) {
        console.error(error);
        alert("검토완료 처리 중 오류가 발생했습니다.");
      } finally {
        setProcessingId(null);
      }
    },
    [processingId, router]
  );

  const columns = useMemo<DataTableColumn<PurchaseReceivingReviewItem>[]>(
    () => [
      {
        key: "receivingNo",
        header: "입고확인번호",
        sortable: true,
        render: (row) => row.receivingNo || "-",
      },
      {
        key: "poNos",
        header: "PO NO.",
        render: (row) => row.poNos?.join(", ") || "-",
      },
      {
        key: "title",
        header: "제목",
        render: (row) => row.title || "-",
      },
      {
        key: "receivingChecker",
        header: "입고확인자",
        sortable: true,
        render: (row) => row.receivingChecker || "-",
      },
      {
        key: "receivingDate",
        header: "입고확인일",
        sortable: true,
        render: (row) => row.receivingDate || "-",
      },
      {
        key: "reviewCompleted",
        header: "검토완료",
        align: "center",
        sortable: true,
        render: (row) => (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              row.reviewCompleted
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {row.reviewCompleted ? "완료" : "대기"}
          </span>
        ),
      },
      {
        key: "id",
        header: "처리",
        align: "center",
        render: (row) => (
          <Button
            type="button"
            variant="outline"
            disabled={row.reviewCompleted || processingId === row.id}
            onClick={(event) => {
              event.stopPropagation();
              handleCompleteReview(row);
            }}
          >
            {processingId === row.id ? "처리 중..." : "검토완료"}
          </Button>
        ),
      },
    ],
    [handleCompleteReview, processingId]
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="입고검토 검색..."
            className="w-96"
          />

          <Select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
            className="w-44"
          >
            <option value="">전체 검토상태</option>
            <option value={PURCHASE_RECEIVING_REVIEW_FILTER.PENDING}>
              {PURCHASE_RECEIVING_REVIEW_STATUS.PENDING}
            </option>
            <option value={PURCHASE_RECEIVING_REVIEW_FILTER.COMPLETED}>
              {PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED}
            </option>
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setReviewStatus("");
            }}
          >
            초기화
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <DataTable
            columns={columns}
            data={filteredData}
            getRowId={(row) => row.id}
            selectedRowId={selectedReceiving?.id}
            onRowClick={setSelectedReceiving}
            emptyMessage="검색 조건에 맞는 입고확인 데이터가 없습니다."
            initialPageSize={20}
          />
        </div>

        <div className="col-span-4">
          <ReceivingDetailCard receiving={selectedReceiving} />
        </div>
      </div>
    </div>
  );
}

function ReceivingDetailCard({
  receiving,
}: {
  receiving: PurchaseReceivingReviewItem | null;
}) {
  if (!receiving) {
    return (
      <Card className="p-4 text-sm text-gray-500">
        확인할 입고확인을 선택해주세요.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          {receiving.receivingNo || "입고확인"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{receiving.title || "-"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailItem label="PO NO." value={receiving.poNos?.join(", ") || "-"} />
        <DetailItem label="입고확인자" value={receiving.receivingChecker || "-"} />
        <DetailItem label="입고확인일" value={receiving.receivingDate || "-"} />
        <DetailItem
          label="검토완료"
          value={receiving.reviewCompleted ? "완료" : "대기"}
        />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-gray-500">거래명세서</div>
        <AttachmentLinks files={receiving.transactionStatementFiles} />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-gray-500">입고증빙</div>
        <AttachmentLinks files={receiving.receivingEvidenceFiles} />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-gray-500">비고</div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          {receiving.memo || "-"}
        </div>
      </div>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-gray-900">{value}</div>
    </div>
  );
}

function AttachmentLinks({
  files,
}: {
  files: PurchaseReceivingReviewItem["transactionStatementFiles"];
}) {
  if (!files || files.length === 0) {
    return <div className="text-sm text-gray-500">첨부파일 없음</div>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-md border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
        >
          {file.filename}
        </a>
      ))}
    </div>
  );
}
