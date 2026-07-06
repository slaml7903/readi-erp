"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation, type NavigationItem } from "@/lib/navigation";

function SidebarLink({ item, depth = 0 }: { item: NavigationItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = item.href === pathname;

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium",
        depth > 0 ? "ml-4" : "",
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <span>{item.label}</span>
      {item.status === "planned" && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          예정
        </span>
      )}
    </Link>
  );
}

function SidebarGroup({ item }: { item: NavigationItem }) {
  const pathname = usePathname();
  const hasActiveChild = item.children?.some((child) => child.href === pathname);
  const [isOpen, setIsOpen] = useState(Boolean(hasActiveChild));

  if (!item.children?.length) {
    return <SidebarLink item={item} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-semibold",
          hasActiveChild
            ? "bg-slate-100 text-slate-900"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")}
      >
        <span>{item.label}</span>
        <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <SidebarLink key={child.href ?? child.label} item={child} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <nav className="space-y-2">
        {navigation.map((item) => (
          <SidebarGroup key={item.href ?? item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}