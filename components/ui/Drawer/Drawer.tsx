"use client";

import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
}

export default function Drawer({
  open,
  title,
  children,
  onClose,
  width = "w-[520px]",
}: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <aside
        className={`relative h-full ${width} bg-white shadow-xl`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-5">
          <h2 className="text-base font-semibold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            닫기
          </button>
        </div>

        <div className="h-[calc(100%-56px)] overflow-y-auto p-5">
          {children}
        </div>
      </aside>
    </div>
  );
}