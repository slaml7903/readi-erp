"use client";

import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  className = "",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-hover)]",
    secondary: "bg-slate-100 text-[var(--text-primary)] hover:bg-slate-200 active:bg-slate-300",
    outline:
      "border border-[var(--border-default)] bg-white text-[var(--text-primary)] hover:bg-slate-50 active:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)]",
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
