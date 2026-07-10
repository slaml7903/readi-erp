"use client";

import { ReactNode, useMemo, useState } from "react";

import EmptyState from "../EmptyState";

export type DataTableColumn<T> = {
  key: keyof T & string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
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
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

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
    if (!column.sortable) return "";
    if (sortKey !== column.key) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const getAlignClass = (align?: "left" | "center" | "right") => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="max-h-[680px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100 text-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  style={{ width: column.width }}
                  className={`p-3 ${getAlignClass(column.align)} ${
                    column.sortable ? "cursor-pointer select-none" : ""
                  }`}
                >
                  {column.header}
                  {getSortIcon(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-gray-900">
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
                    className={`border-b border-gray-100 ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "bg-blue-50 hover:bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{ width: column.width }}
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
