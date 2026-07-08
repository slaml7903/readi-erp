"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { GlobalSearchResult } from "@/features/search/services/global-search.service";

function getTypeLabel(type: GlobalSearchResult["type"]) {
  if (type === "purchase-request") return "구매요청";
  if (type === "purchase-order") return "발주";
  return "입고";
}

export default function GlobalSearch() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canSearch = keyword.trim().length >= 2;
  const visibleResults = canSearch ? results : [];

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(keyword)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        setResults(data.results ?? []);
        setIsOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, keyword]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-[420px]">
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        onFocus={() => {
          if (visibleResults.length > 0) setIsOpen(true);
        }}
        placeholder="PR번호, PO번호, 거래처, 품목 검색..."
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
      />

      {isOpen && canSearch ? (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="px-3 py-3 text-sm text-slate-500">검색 중...</div>
          ) : visibleResults.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {visibleResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={() => setIsOpen(false)}
                  className="block border-b border-slate-100 px-3 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">
                      {result.label}
                    </div>
                    <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {getTypeLabel(result.type)}
                    </div>
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {result.description}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
