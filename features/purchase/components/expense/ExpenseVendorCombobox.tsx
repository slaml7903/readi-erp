"use client";

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import type { ExpenseVendorOption } from "../../types/expense.type";

export default function ExpenseVendorCombobox({
  vendors,
  value,
  query,
  onChange,
  onQueryChange,
}: {
  vendors: ExpenseVendorOption[];
  value: string;
  query: string;
  onChange: (vendorRecordId: string) => void;
  onQueryChange: (query: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredVendors = useMemo(() => {
    const keyword = normalize(query);
    const matches = keyword
      ? vendors.filter((vendor) => normalize(vendor.name).includes(keyword))
      : vendors;
    return matches.slice(0, 50);
  }, [query, vendors]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(0, filteredVendors.length - 1)
  );

  const selectVendor = (vendor: ExpenseVendorOption) => {
    onChange(vendor.id);
    onQueryChange(vendor.name);
    setActiveIndex(0);
    setIsOpen(false);
  };

  const clear = () => {
    onChange("");
    onQueryChange("");
    setActiveIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (filteredVendors.length === 0) return 0;
        return (current + direction + filteredVendors.length) % filteredVendors.length;
      });
      return;
    }
    if (event.key === "Enter" && isOpen && filteredVendors[safeActiveIndex]) {
      event.preventDefault();
      selectVendor(filteredVendors[safeActiveIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && filteredVendors[safeActiveIndex] ? `${listboxId}-${filteredVendors[safeActiveIndex].id}` : undefined}
        value={query}
        placeholder="전체 거래처"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setActiveIndex(0);
          if (value) onChange("");
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 pr-16 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {query ? (
        <button type="button" aria-label="거래처 선택 초기화" onClick={clear} className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
      ) : null}
      <button type="button" aria-label="거래처 목록 열기" onClick={() => setIsOpen((open) => !open)} className="absolute right-1 top-1/2 flex h-8 w-7 -translate-y-1/2 items-center justify-center rounded text-xs text-gray-500 hover:bg-gray-100">▼</button>

      {isOpen ? (
        <div id={listboxId} role="listbox" className="absolute z-40 mt-1 max-h-60 w-full min-w-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          {filteredVendors.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">일치하는 거래처가 없습니다.</p>
          ) : filteredVendors.map((vendor, index) => (
            <button
              id={`${listboxId}-${vendor.id}`}
              key={vendor.id}
              type="button"
              role="option"
              aria-selected={vendor.id === value}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectVendor(vendor)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${index === safeActiveIndex ? "bg-blue-50 text-blue-900" : "text-gray-800 hover:bg-gray-100"}`}
            >
              {vendor.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ko");
}
