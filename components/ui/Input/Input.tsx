"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-10 rounded-md border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-primary-light)] disabled:bg-slate-100 disabled:text-[var(--text-disabled)] ${className}`}
      {...props}
    />
  );
}
