"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, DataTable, Input, SearchInput, Select } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { INVENTORY_MOVEMENT_TYPES } from "../constants/inventory-movement-type";
import type {
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from "../types/inventory.type";
import { normalizeInventorySearch } from "./InventoryClient";
import InventoryMovementForm from "./InventoryMovementForm";

const columns: DataTableColumn<InventoryMovement>[] = [
  { key: "transactionDate", header: "거래일자", sortable: true, width: "120px" },
  { key: "stockNumber", header: "stock번호", width: "130px", render: (movement) => movement.stockNumber || "-" },
  { key: "type", header: "유형", sortable: true, width: "120px" },
  { key: "itemCode", header: "품목코드", sortable: true, width: "150px" },
  { key: "itemName", header: "품명", sortable: true, width: "220px" },
  {
    key: "quantity",
    header: "수량",
    align: "right",
    sortable: true,
    width: "100px",
    render: (movement) => movement.quantity.toLocaleString("ko-KR"),
  },
  {
    key: "signedQuantity",
    header: "증감",
    align: "right",
    sortable: true,
    width: "100px",
    render: (movement) => (
      <span className={movement.signedQuantity < 0 ? "text-red-600" : "text-blue-700"}>
        {movement.signedQuantity > 0 ? "+" : ""}{movement.signedQuantity.toLocaleString("ko-KR")}
      </span>
    ),
  },
];

type InventoryApiData = { items: InventoryItem[]; movements: InventoryMovement[] };

export default function InventoryMovementClient({
  initialItems,
  initialMovements,
}: {
  initialItems: InventoryItem[];
  initialMovements: InventoryMovement[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [movements, setMovements] = useState(initialMovements);
  const [itemSearch, setItemSearch] = useState("");
  const [type, setType] = useState<InventoryMovementType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredMovements = useMemo(() => {
    const keywords = normalizeInventorySearch(itemSearch).split(" ").filter(Boolean);
    return movements.filter((movement) => {
      if (type && movement.type !== type) return false;
      if (startDate && movement.transactionDate < startDate) return false;
      if (endDate && movement.transactionDate > endDate) return false;
      const searchable = normalizeInventorySearch(`${movement.itemCode} ${movement.itemName}`);
      return keywords.every((keyword) => searchable.includes(keyword));
    });
  }, [endDate, itemSearch, movements, startDate, type]);

  async function refreshData() {
    const response = await fetch("/api/inventory/movements", { cache: "no-store" });
    const body = (await response.json()) as InventoryApiData | { message?: string };
    if (!response.ok || !("items" in body)) {
      throw new Error("message" in body && body.message ? body.message : "재고 데이터를 새로고침하지 못했습니다.");
    }
    setItems(body.items);
    setMovements(body.movements);
  }

  async function submit(input: CreateInventoryMovementInput) {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(body.message || "재고변동을 등록하지 못했습니다.");

      await refreshData();
      setFormOpen(false);
      setSuccess(body.message || "재고변동이 등록되었습니다.");
      router.refresh();
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "재고변동을 등록하지 못했습니다.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">구매입고는 구매DB Sync로만 반영됩니다.</p>
        <Button type="button" onClick={() => { setError(""); setSuccess(""); setFormOpen(true); }}>
          재고변동 등록
        </Button>
      </div>

      {success ? (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[minmax(220px,1fr)_160px_160px_160px]">
        <SearchInput value={itemSearch} onChange={setItemSearch} placeholder="품목코드 또는 품명 검색" className="w-full" />
        <Select aria-label="재고변동 유형" value={type} onChange={(event) => setType(event.target.value as InventoryMovementType | "")}>
          <option value="">전체 유형</option>
          {INVENTORY_MOVEMENT_TYPES.map((movementType) => <option key={movementType} value={movementType}>{movementType}</option>)}
        </Select>
        <Input aria-label="조회 시작일" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Input aria-label="조회 종료일" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
      </div>

      <DataTable columns={columns} data={filteredMovements} emptyMessage="조건에 맞는 재고변동 내역이 없습니다." getRowId={(movement) => movement.id} />

      <InventoryMovementForm
        open={formOpen}
        items={items}
        submitting={submitting}
        error={error}
        onClose={() => { setFormOpen(false); setError(""); }}
        onSubmit={submit}
      />
    </div>
  );
}
