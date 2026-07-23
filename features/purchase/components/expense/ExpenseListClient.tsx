"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, EmptyState, SearchInput, StatusBadge } from "@/components/ui";
import { useResizableColumns } from "@/components/ui/DataTable";
import {
  EXPENSE_EVIDENCE_STATUS,
  EXPENSE_STATUS,
} from "../../config/expense.config";
import type {
  ExpenseFilters,
  ExpenseListResult,
  ExpenseStatusFilter,
} from "../../types/expense.type";
import ExpenseActionButton from "./ExpenseActionButton";
import ExpenseAttachmentCell from "./ExpenseAttachmentCell";
import ExpenseVendorCombobox from "./ExpenseVendorCombobox";

type FilterForm = {
  search: string;
  vendor: string;
  vendorQuery: string;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  evidence: string;
};

const EXPENSE_COLUMNS = [
  ["requestNo", "구매요청번호", 105], ["orderNo", "발주번호", 100],
  ["vendor", "거래처", 115], ["item", "품명", 145], ["amount", "금액", 105],
  ["approval", "기안서", 70], ["requestForm", "구매요청서", 90],
  ["quotation", "견적서", 70], ["orderFile", "발주서", 70],
  ["businessRegistration", "사업자등록증", 105], ["bankbook", "통장사본", 85],
  ["status", "지출 상태", 95], ["action", "처리", 95],
].map(([key, label, defaultWidth]) => ({
  key: String(key), label: String(label), defaultWidth: Number(defaultWidth), minWidth: 58,
}));

export default function ExpenseListClient({
  result,
  filters,
}: {
  result: ExpenseListResult;
  filters: ExpenseFilters;
}) {
  const router = useRouter();
  const initialVendorName = result.vendors.find(
    (vendor) => vendor.id === filters.vendorRecordId
  )?.name;
  const [form, setForm] = useState<FilterForm>({
    search: filters.search,
    vendor: filters.vendorRecordId ?? "",
    vendorQuery: initialVendorName ?? "",
    from: filters.dateFrom ?? "",
    to: filters.dateTo ?? "",
    minAmount: filters.minAmount?.toString() ?? "",
    maxAmount: filters.maxAmount?.toString() ?? "",
    evidence: filters.evidence,
  });
  const { getColumnStyle, renderResizeHandle, resetAll, hasCustomWidths } =
    useResizableColumns("purchase-expenses", EXPENSE_COLUMNS);

  const navigate = (
    overrides: Partial<FilterForm> & { status?: ExpenseStatusFilter; page?: number }
  ) => {
    const next = { ...form, ...overrides };
    const params = new URLSearchParams();
    params.set("status", overrides.status ?? filters.status);
    if (next.search.trim()) params.set("query", next.search.trim());
    if (next.vendor) params.set("vendor", next.vendor);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.minAmount.trim()) params.set("minAmount", next.minAmount.replaceAll(",", ""));
    if (next.maxAmount.trim()) params.set("maxAmount", next.maxAmount.replaceAll(",", ""));
    if (next.evidence !== EXPENSE_EVIDENCE_STATUS.all) {
      params.set("evidence", next.evidence);
    }
    if ((overrides.page ?? 1) > 1) params.set("page", String(overrides.page));
    router.push(`/purchase/expenses?${params.toString()}`);
  };

  const submitFilters = (event: FormEvent) => {
    event.preventDefault();
    navigate({ page: 1 });
  };

  const resetFilters = () => {
    const reset: FilterForm = {
      search: "",
      vendor: "",
      vendorQuery: "",
      from: "",
      to: "",
      minAmount: "",
      maxAmount: "",
      evidence: EXPENSE_EVIDENCE_STATUS.all,
    };
    setForm(reset);
    navigate({ ...reset, status: EXPENSE_STATUS.waiting, page: 1 });
  };

  const openDetail = (orderId: string) => {
    router.push(`/purchase/expenses/${orderId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-gray-200 bg-white p-1 sm:w-fit">
        {[
          [EXPENSE_STATUS.waiting, "지출대기"],
          [EXPENSE_STATUS.completed, "지출완료"],
          [EXPENSE_STATUS.all, "전체"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => navigate({ status: value as ExpenseStatusFilter, page: 1 })}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              filters.status === value
                ? "bg-[var(--brand-primary)] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submitFilters} className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-6">
          <div className="lg:col-span-2 xl:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">통합 검색</label>
            <SearchInput
              value={form.search}
              onChange={(search) => setForm((previous) => ({ ...previous, search }))}
              placeholder="구매요청번호, 발주번호, 거래처, 품명"
              className="w-full"
            />
          </div>
          <FilterField label="거래처">
            <ExpenseVendorCombobox
              vendors={result.vendors}
              value={form.vendor}
              query={form.vendorQuery}
              onChange={(vendor) => setForm((previous) => ({ ...previous, vendor }))}
              onQueryChange={(vendorQuery) => setForm((previous) => ({ ...previous, vendorQuery }))}
            />
          </FilterField>
          <FilterField label="발주일 시작">
            <input type="date" value={form.from} onChange={(event) => setForm((previous) => ({ ...previous, from: event.target.value }))} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FilterField>
          <FilterField label="발주일 종료">
            <input type="date" value={form.to} onChange={(event) => setForm((previous) => ({ ...previous, to: event.target.value }))} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FilterField>
          <FilterField label="증빙 상태">
            <select value={form.evidence} onChange={(event) => setForm((previous) => ({ ...previous, evidence: event.target.value }))} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value={EXPENSE_EVIDENCE_STATUS.all}>전체</option>
              <option value={EXPENSE_EVIDENCE_STATUS.missing}>서류 누락 있음</option>
              <option value={EXPENSE_EVIDENCE_STATUS.complete}>주요 서류 모두 있음</option>
            </select>
          </FilterField>
          <FilterField label="최소금액">
            <input inputMode="numeric" value={form.minAmount} onChange={(event) => setForm((previous) => ({ ...previous, minAmount: event.target.value }))} placeholder="0" className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FilterField>
          <FilterField label="최대금액">
            <input inputMode="numeric" value={form.maxAmount} onChange={(event) => setForm((previous) => ({ ...previous, maxAmount: event.target.value }))} placeholder="제한 없음" className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FilterField>
          <div className="flex items-end gap-2 lg:col-span-2">
            <Button type="submit">조회</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>필터 초기화</Button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {hasCustomWidths ? (
          <div className="flex justify-end border-b border-gray-100 px-3 py-2">
            <button type="button" onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-900">컬럼 너비 초기화</button>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm" style={{ minWidth: EXPENSE_COLUMNS.reduce((sum, column) => sum + column.defaultWidth, 0) }}>
            <colgroup>
              {EXPENSE_COLUMNS.map((column) => <col key={column.key} style={getColumnStyle(column.key)} />)}
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-100 text-gray-700">
              <tr>
                {EXPENSE_COLUMNS.map((column) => (
                  <th key={column.key} className="relative px-2 py-2.5 text-center align-middle font-medium">
                    {column.label}{renderResizeHandle(column.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {result.items.length === 0 ? (
                <tr><td colSpan={13}><EmptyState message="조건에 맞는 지출 대상이 없습니다." /></td></tr>
              ) : result.items.map((expense) => (
                <tr
                  key={expense.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`${expense.orderNumber || "발주"} 지출 상세 열기`}
                  onClick={() => openDetail(expense.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => openDetail(expense.id))}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                >
                  <Cell className="whitespace-nowrap">{expense.requestNumbers.join(", ") || "-"}</Cell>
                  <Cell className="whitespace-nowrap font-medium">{expense.orderNumber || "-"}</Cell>
                  <Cell><TruncatedText value={expense.vendorNames.join(", ") || "-"} /></Cell>
                  <Cell><TruncatedText value={expense.itemSummary} /></Cell>
                  <Cell className="whitespace-nowrap font-medium">{expense.amount.toLocaleString("ko-KR")}원</Cell>
                  <Cell><ExpenseAttachmentCell files={expense.approvalFiles} documentType="기안서" /></Cell>
                  <Cell><ExpenseAttachmentCell files={expense.requestFormFiles} documentType="구매요청서" /></Cell>
                  <Cell><ExpenseAttachmentCell files={expense.quotationFiles} documentType="견적서" /></Cell>
                  <Cell><ExpenseAttachmentCell files={expense.purchaseOrderFiles} documentType="발주서" /></Cell>
                  <Cell><ExpenseAttachmentCell files={expense.businessRegistrationFiles} documentType="사업자등록증" /></Cell>
                  <Cell><ExpenseAttachmentCell files={expense.bankbookFiles} documentType="통장사본" /></Cell>
                  <Cell>
                    <StatusBadge status={expense.expenseCompleted ? "지출완료" : "지출대기"} />
                  </Cell>
                  <Cell>
                    {expense.expenseCompleted ? (
                      <span className="text-xs font-medium text-green-700">완료됨</span>
                    ) : (
                      <ExpenseActionButton
                        orderId={expense.id}
                        orderNumber={expense.orderNumber}
                        vendorName={expense.vendorNames.join(", ")}
                        itemSummary={expense.itemSummary}
                        amount={expense.amount}
                        expenseCompleted={expense.expenseCompleted}
                        missingDocumentLabels={expense.missingDocumentLabels}
                      />
                    )}
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
          <span>총 <strong>{result.total}</strong>건</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={result.page <= 1} onClick={() => navigate({ page: result.page - 1 })}>이전</Button>
            <span className="min-w-16 text-center">{result.page} / {result.totalPages}</span>
            <Button type="button" variant="outline" disabled={result.page >= result.totalPages} onClick={() => navigate({ page: result.page + 1 })}>다음</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>{children}</div>;
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-2.5 text-center align-middle ${className}`}>{children}</td>;
}

function TruncatedText({ value }: { value: string }) {
  return <span title={value} className="block truncate">{value}</span>;
}

function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, open: () => void) {
  if (event.target !== event.currentTarget) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  open();
}
