"use client";

import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export default function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-500 ${className}`}
      {...props}
    />
  );
}