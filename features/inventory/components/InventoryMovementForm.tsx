"use client";

import { useMemo, useState } from "react";

import { Button, Drawer, Input, Select } from "@/components/ui";
import { INVENTORY_MOVEMENT_TYPES } from "../constants/inventory-movement-type";
import type {
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryMovementType,
} from "../types/inventory.type";
import { normalizeInventorySearch } from "./InventoryClient";

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function InventoryMovementForm({
  open,
  items,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  items: InventoryItem[];
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: CreateInventoryMovementInput) => Promise<boolean>;
}) {
  const [transactionDate, setTransactionDate] = useState(todayInKorea);
  const [type, setType] = useState<InventoryMovementType | "">("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem>();
  const [quantity, setQuantity] = useState("");

  const itemOptions = useMemo(() => {
    const keywords = normalizeInventorySearch(itemSearch).split(" ").filter(Boolean);
    if (keywords.length === 0) return items.slice(0, 20);

    return items
      .filter((item) => {
        const searchable = normalizeInventorySearch(
          [item.itemCode, item.itemName, item.specification].filter(Boolean).join(" ")
        );
        return keywords.every((keyword) => searchable.includes(keyword));
      })
      .slice(0, 20);
  }, [itemSearch, items]);

  function reset() {
    setTransactionDate(todayInKorea());
    setType("");
    setItemSearch("");
    setSelectedItem(undefined);
    setQuantity("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!type || !selectedItem) return;

    const succeeded = await onSubmit({
      transactionDate,
      type,
      itemId: selectedItem.id,
      quantity: Number(quantity),
    });
    if (succeeded) reset();
  }

  function close() {
    if (submitting) return;
    reset();
    onClose();
  }

  return (
    <Drawer open={open} title="재고변동 등록" onClose={close} width="w-full sm:w-[560px]">
      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        {error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="block space-y-2 text-sm font-medium text-gray-700">
          <span>거래일자 *</span>
          <Input
            type="date"
            required
            value={transactionDate}
            onChange={(event) => setTransactionDate(event.target.value)}
            className="w-full"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-gray-700">
          <span>유형 *</span>
          <Select
            required
            value={type}
            onChange={(event) => setType(event.target.value as InventoryMovementType)}
            className="w-full"
          >
            <option value="">유형 선택</option>
            {INVENTORY_MOVEMENT_TYPES.map((movementType) => (
              <option key={movementType} value={movementType}>{movementType}</option>
            ))}
          </Select>
        </label>

        <div className="space-y-2">
          <label htmlFor="inventory-item-search" className="block text-sm font-medium text-gray-700">
            품목 *
          </label>
          {selectedItem ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium text-gray-900">{selectedItem.itemCode} · {selectedItem.itemName}</p>
                <p className="mt-1 text-gray-600">{selectedItem.specification || "규격 없음"} / 현재고 {selectedItem.currentStock.toLocaleString("ko-KR")}</p>
              </div>
              <button type="button" className="shrink-0 text-sm text-blue-700" onClick={() => setSelectedItem(undefined)}>
                변경
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="inventory-item-search"
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder="품목코드, 품명, 규격 검색"
                className="w-full"
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
                {itemOptions.length > 0 ? itemOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setItemSearch("");
                    }}
                    className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{item.itemCode} · {item.itemName}</span>
                    <span className="mt-0.5 block text-gray-500">{item.specification || "규격 없음"}</span>
                  </button>
                )) : (
                  <p className="p-4 text-center text-sm text-gray-500">검색 결과가 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <label className="block space-y-2 text-sm font-medium text-gray-700">
          <span>수량 *</span>
          <Input
            type="number"
            required
            min={1}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0보다 큰 정수"
            className="w-full"
          />
        </label>

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={close} disabled={submitting}>취소</Button>
          <Button
            type="submit"
            disabled={submitting || !type || !selectedItem || !transactionDate || !quantity}
          >
            {submitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
