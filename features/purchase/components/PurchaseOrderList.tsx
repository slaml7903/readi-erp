"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, Card, Input, Select, StatusBadge } from "@/components/ui";
import { useResizableColumns } from "@/components/ui/DataTable";
import { compareLatestFirst } from "@/lib/sort";

import { PURCHASE_ORDER_STATUS_OPTIONS } from "../constants/purchase-status";
import type { PurchaseOrderSummary, PurchaseRequest } from "../types/purchase.type";

type PurchaseOrderListProps = {
  requests: PurchaseRequest[];
  initialSearch?: string;
};

type PurchaseOrderRow = PurchaseOrderSummary & {
  prNo: string;
  requestTitle: string;
};

const ORDER_COLUMNS = [
  { key: "poNo", label: "발주번호", defaultWidth: 140, minWidth: 100 },
  { key: "prNo", label: "PR NO.", defaultWidth: 130, minWidth: 90 },
  { key: "title", label: "제목", defaultWidth: 220, minWidth: 130 },
  { key: "vendor", label: "벤더", defaultWidth: 170, minWidth: 110 },
  { key: "expectedDate", label: "예상 입고일", defaultWidth: 135, minWidth: 110 },
  { key: "status", label: "상태", defaultWidth: 110, minWidth: 90 },
  { key: "receiving", label: "입고확인", defaultWidth: 145, minWidth: 120 },
] as const;

function createOrderRows(requests: PurchaseRequest[]): PurchaseOrderRow[] {
  return requests
    .flatMap((request) =>
      (request.orderSummaries ?? []).map((order) => ({
        ...order,
        prNo: request.prNo,
        requestTitle: request.title,
      }))
    )
    .sort((a, b) =>
      compareLatestFirst(
        { id: a.id, date: a.orderDate, createdTime: a.createdTime },
        { id: b.id, date: b.orderDate, createdTime: b.createdTime }
      )
    );
}

export default function PurchaseOrderList({
  requests,
  initialSearch = "",
}: PurchaseOrderListProps) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("");
  const orders = useMemo(() => createOrderRows(requests), [requests]);
  const { getColumnStyle, renderResizeHandle, resetAll, hasCustomWidths } =
    useResizableColumns("purchase-orders", ORDER_COLUMNS);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const keywordMatched =
        !keyword ||
        [
          order.poNo,
          order.title,
          order.requestTitle,
          order.receivingChecker,
          order.status,
          order.expectedReceivingDate,
          order.vendorNames?.join(", "),
        ].some((value) => value?.toLowerCase().includes(keyword));

      const statusMatched = !status || order.status === status;

      return keywordMatched && statusMatched;
    });
  }, [orders, search, status]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="발주 검색..."
            className="w-96"
          />

          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-44"
          >
            <option value="">전체 상태</option>
            {PURCHASE_ORDER_STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
          >
            초기화
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
      {hasCustomWidths ? (
        <div className="flex justify-end border-b border-gray-100 px-3 py-2">
          <button type="button" onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-900">
            컬럼 너비 초기화
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm [&_td]:text-center" style={{ minWidth: ORDER_COLUMNS.reduce((sum, column) => sum + column.defaultWidth, 0) }}>
          <colgroup>
            {ORDER_COLUMNS.map((column) => <col key={column.key} style={getColumnStyle(column.key)} />)}
          </colgroup>
          <thead className="border-b border-gray-200 bg-gray-100 text-xs text-gray-600">
            <tr>
              {ORDER_COLUMNS.map((column) => (
                <th key={column.key} className="relative px-3 py-3 text-center">
                  {column.label}
                  {renderResizeHandle(column.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  검색 조건에 맞는 발주 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-medium">{order.poNo || "-"}</td>
                  <td className="px-3 py-3">{order.prNo || "-"}</td>
                  <td className="px-3 py-3">{order.title || order.requestTitle}</td>
                  <td className="px-3 py-3">{order.vendorNames?.join(", ") || "-"}</td>
                  <td className="px-3 py-3">{order.expectedReceivingDate || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-3 py-3 text-center">
                    <Link
                      href="/purchase/receiving/new"
                      className="inline-flex h-9 items-center rounded-md bg-[var(--brand-primary)] px-3 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
                    >
                      입고확인 요청
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </Card>
    </div>
  );
}
