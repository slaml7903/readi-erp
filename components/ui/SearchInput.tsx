"use client";

import Input from "./Input";
import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "검색",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <Input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full pl-9" />
    </div>
  );
}
