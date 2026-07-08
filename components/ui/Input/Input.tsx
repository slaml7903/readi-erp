"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-500 ${className}`}
      {...props}
    />
  );
}
