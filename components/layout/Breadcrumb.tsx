"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getBreadcrumbs } from "@/lib/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-slate-900" : ""}>
                {item.label}
              </span>
            )}
            {!isLast ? <span className="text-slate-300">&gt;</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
