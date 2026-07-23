"use client";

import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`h-10 rounded-md border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-primary-light)] disabled:bg-slate-100 disabled:text-[var(--text-disabled)] ${className}`}
      {...props}
    />
  );
}
