"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, Card, Input, Select } from "@/components/ui";

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

function createOrderRows(requests: PurchaseRequest[]): PurchaseOrderRow[] {
  return requests.flatMap((request) =>
    (request.orderSummaries ?? []).map((order) => ({
      ...order,
      prNo: request.prNo,
      requestTitle: request.title,
    }))
  );
}

export default function PurchaseOrderList({
  requests,
  initialSearch = "",
}: PurchaseOrderListProps) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("");
  const orders = useMemo(() => createOrderRows(requests), [requests]);

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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-100 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-3 text-left">발주번호</th>
              <th className="px-3 py-3 text-left">PR NO.</th>
              <th className="px-3 py-3 text-left">제목</th>
              <th className="px-3 py-3 text-left">벤더</th>
              <th className="px-3 py-3 text-left">예상 입고일</th>
              <th className="px-3 py-3 text-left">상태</th>
              <th className="px-3 py-3 text-center">입고확인</th>
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
                  <td className="px-3 py-3">{order.status || "-"}</td>
                  <td className="px-3 py-3 text-center">
                    <Link
                      href={`/purchase/receiving/new?orderId=${order.id}`}
                      className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      입고확인 제출
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
