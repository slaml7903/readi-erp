"use client";

import { useMemo, useState } from "react";

import { StatCard } from "@/components/ui";
import type { InventoryItem, InventoryStockStatus } from "../types/inventory.type";
import InventoryDetail from "./InventoryDetail";
import InventoryFilterBar from "./InventoryFilterBar";
import InventoryTable from "./InventoryTable";

export function normalizeInventorySearch(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

export default function InventoryClient({ items }: { items: InventoryItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InventoryStockStatus | "">("");
  const [department, setDepartment] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem>();

  const departments = useMemo(
    () =>
      [...new Set(items.map((item) => item.department).filter((value): value is string => Boolean(value)))]
        .sort((a, b) => a.localeCompare(b, "ko")),
    [items]
  );

  const filteredItems = useMemo(() => {
    const keywords = normalizeInventorySearch(search).split(" ").filter(Boolean);

    return items.filter((item) => {
      if (status && item.status !== status) return false;
      if (department && item.department !== department) return false;

      const searchable = normalizeInventorySearch(
        [item.itemCode, item.itemName, item.specification, item.vendor, item.department]
          .filter(Boolean)
          .join(" ")
      );
      return keywords.every((keyword) => searchable.includes(keyword));
    });
  }, [department, items, search, status]);

  const summary = useMemo(
    () => ({
      total: items.length,
      normal: items.filter((item) => item.status === "정상").length,
      reorder: items.filter((item) => item.status === "발주필요").length,
      outOfStock: items.filter((item) => item.status === "품절").length,
      error: items.filter((item) => item.status === "재고오류").length,
      unset: items.filter((item) => item.status === "기준미설정").length,
    }),
    [items]
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="전체 품목 수" value={summary.total} />
        <StatCard title="정상" value={summary.normal} />
        <StatCard title="발주필요" value={summary.reorder} />
        <StatCard title="품절" value={summary.outOfStock} />
        <StatCard title="재고오류" value={summary.error} />
        <StatCard title="기준미설정" value={summary.unset} />
      </div>

      <InventoryFilterBar
        search={search}
        status={status}
        department={department}
        departments={departments}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDepartmentChange={setDepartment}
      />

      <InventoryTable
        items={filteredItems}
        selectedItemId={selectedItem?.id}
        onSelect={setSelectedItem}
      />
      <InventoryDetail item={selectedItem} onClose={() => setSelectedItem(undefined)} />
    </>
  );
}
