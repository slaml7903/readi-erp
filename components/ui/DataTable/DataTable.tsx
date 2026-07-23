"use client";

import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";

import EmptyState from "../EmptyState";
import { useResizableColumns } from "./useResizableColumns";

export type DataTableColumn<T> = {
  key: keyof T & string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  render?: (row: T, index: number) => ReactNode;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  initialPageSize?: number;
  getRowId?: (row: T) => string;
  selectedRowId?: string | null;
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
  tableClassName?: string;
  tableId?: string;
}

type SortDirection = "asc" | "desc";

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "데이터가 없습니다.",
  initialPageSize = 20,
  getRowId,
  selectedRowId,
  onRowClick,
  getRowAriaLabel,
  tableClassName = "",
  tableId,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const resizeDefinitions = useMemo(
    () =>
      tableId
        ? columns.map((column) => ({
            key: column.key,
            defaultWidth:
              column.defaultWidth ?? parsePixelWidth(column.width) ?? 160,
            minWidth: column.minWidth ?? inferMinimumWidth(column),
            maxWidth: column.maxWidth,
          }))
        : [],
    [columns, tableId]
  );
  const {
    getColumnStyle,
    renderResizeHandle,
    resetAll: resetColumnWidths,
    hasCustomWidths,
  } = useResizableColumns(tableId ?? "data-table", resizeDefinitions);
  const tableMinWidth = resizeDefinitions.reduce(
    (sum, column) => sum + Number(getColumnStyle(column.key).width ?? 0),
    0
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue), "ko")
        : String(bValue).localeCompare(String(aValue), "ko");
    });
  }, [data, sortKey, sortDirection]);

  const totalCount = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;

    setPage(1);

    if (sortKey === column.key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(column.key);
    setSortDirection("asc");
  };

  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;
    if (sortKey !== column.key) return <ArrowUpDown aria-hidden="true" size={13} />;
    return sortDirection === "asc" ? <ArrowUp aria-hidden="true" size={13} /> : <ArrowDown aria-hidden="true" size={13} />;
  };

  const getAlignClass = (align?: "left" | "center" | "right") => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-center";
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-white shadow-[0_1px_2px_rgba(0,55,85,0.04)]">
      {tableId && hasCustomWidths ? (
        <div className="flex justify-end border-b border-gray-100 px-3 py-1.5">
          <button type="button" onClick={resetColumnWidths} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
            <RotateCcw aria-hidden="true" size={13} />컬럼 너비 초기화
          </button>
        </div>
      ) : null}
      <div className="max-h-[680px] overflow-auto">
        <table
          className={`w-full table-fixed text-sm ${tableClassName}`}
          style={tableId ? { minWidth: tableMinWidth } : undefined}
        >
          {tableId ? (
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={getColumnStyle(column.key)} />
              ))}
            </colgroup>
          ) : null}
          <thead className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-slate-100 text-[var(--text-primary)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  style={tableId ? getColumnStyle(column.key) : { width: column.width }}
                  className={`relative p-3 ${getAlignClass(column.align)} ${
                    column.sortable ? "cursor-pointer select-none" : ""
                  }`}
                >
                  <span className={`inline-flex items-center justify-center gap-1 ${column.align === "left" ? "justify-start" : column.align === "right" ? "justify-end" : ""}`}>{column.header}{getSortIcon(column)}</span>
                  {tableId ? renderResizeHandle(column.key) : null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-[var(--text-primary)]">
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-0"
                >
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIndex) => {
                const absoluteIndex = (currentPage - 1) * pageSize + rowIndex;
                const rowId = getRowId ? getRowId(row) : String(absoluteIndex);
                const isSelected = selectedRowId === rowId;

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(event) => {
                      if (!onRowClick || event.target !== event.currentTarget) return;
                      if (event.key !== "Enter" && event.key !== " ") return;

                      event.preventDefault();
                      onRowClick(row);
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "link" : undefined}
                    aria-label={onRowClick ? getRowAriaLabel?.(row) : undefined}
                    className={`border-b border-slate-100 ${
                      onRowClick
                        ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-secondary)]"
                        : ""
                    } ${
                      isSelected
                        ? "bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-light)]"
                        : "hover:bg-[color-mix(in_srgb,var(--brand-primary-light)_55%,white)]"
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={tableId ? getColumnStyle(column.key) : { width: column.width }}
                        className={`p-3 ${getAlignClass(column.align)}`}
                      >
                        {column.render
                          ? column.render(row, absoluteIndex)
                          : String(row[column.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
        <div>
          총 <span className="font-medium">{totalCount}</span>건
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-300 px-2 text-sm"
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
            <option value={100}>100개씩</option>
          </select>

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-9 rounded-md border border-gray-300 px-3 disabled:opacity-40"
          >
            이전
          </button>

          <span className="min-w-16 text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="h-9 rounded-md border border-gray-300 px-3 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

function parsePixelWidth(value: string | undefined) {
  if (!value?.endsWith("px")) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferMinimumWidth<T>(column: DataTableColumn<T>) {
  const key = column.key.toLowerCase();
  const header = column.header.toLowerCase();
  if (key.includes("status") || header.includes("상태")) return 80;
  if (key.includes("date") || header.includes("일자") || header.includes("일")) return 100;
  if (header.includes("no.") || header.includes("번호")) return 110;
  if (header.includes("금액") || header.includes("단가") || header.includes("재고")) return 100;
  if (header.includes("품명") || header.includes("제목") || header.includes("비고")) return 160;
  if (header.includes("서류") || header.includes("첨부")) return 70;
  return 80;
}
