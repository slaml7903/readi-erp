"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { getBreadcrumbs } from "@/lib/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav aria-label="현재 위치" className="flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="inline-flex items-center gap-1 hover:text-[var(--brand-primary)]">
                {index === 0 ? <Home aria-hidden="true" size={13} /> : null}{item.label}
              </Link>
            ) : (
              <span className={`inline-flex items-center gap-1 ${isLast ? "font-medium text-[var(--text-primary)]" : ""}`}>
                {index === 0 ? <Home aria-hidden="true" size={13} /> : null}{item.label}
              </span>
            )}
            {!isLast ? <ChevronRight aria-hidden="true" size={13} className="text-slate-300" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
