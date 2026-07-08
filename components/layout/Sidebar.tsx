"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation, type NavigationItem } from "@/lib/navigation";

function hasActivePath(item: NavigationItem, pathname: string): boolean {
  if (item.href) {
    return item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return Boolean(item.children?.some((child) => hasActivePath(child, pathname)));
}

function SidebarLink({ item, depth = 0 }: { item: NavigationItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = hasActivePath(item, pathname);
  const paddingByDepth = ["pl-4", "pl-7", "pl-10", "pl-12"][depth] ?? "pl-12";

  if (!item.href) {
    return (
      <Link
        href={`/planned?menu=${encodeURIComponent(item.label)}`}
        prefetch={false}
        className={[
          "flex items-center justify-between rounded-lg py-2.5 pr-3 text-sm font-medium text-slate-400",
          "hover:bg-slate-50 hover:text-slate-500",
          paddingByDepth,
        ].join(" ")}
      >
        <span>{item.label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
          준비중
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch
      className={[
        "flex items-center justify-between rounded-lg py-2.5 pr-3 text-sm font-medium",
        paddingByDepth,
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
  const hasActiveChild = hasActivePath(item, pathname);
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
            child.children?.length ? (
              <SidebarNestedGroup
                key={child.href ?? child.label}
                item={child}
                depth={1}
              />
            ) : (
              <SidebarLink
                key={child.href ?? child.label}
                item={child}
                depth={1}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNestedGroup({
  item,
  depth,
}: {
  item: NavigationItem;
  depth: number;
}) {
  const pathname = usePathname();
  const hasActiveChild = hasActivePath(item, pathname);
  const [isOpen, setIsOpen] = useState(Boolean(hasActiveChild));
  const paddingByDepth = ["pl-4", "pl-7", "pl-10", "pl-12"][depth] ?? "pl-12";

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "flex w-full items-center justify-between rounded-lg py-2.5 pr-3 text-left text-sm font-semibold",
          paddingByDepth,
          hasActiveChild
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-100",
        ].join(" ")}
      >
        <span>{item.label}</span>
        <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen ? (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) =>
            child.children?.length ? (
              <SidebarNestedGroup
                key={child.href ?? child.label}
                item={child}
                depth={depth + 1}
              />
            ) : (
              <SidebarLink
                key={child.href ?? child.label}
                item={child}
                depth={depth + 1}
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="mb-6 px-4">
        <div className="text-base font-bold text-slate-900">READi ERP</div>
        <div className="text-xs text-slate-500">READi ROBUST MACHINE</div>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => (
          <SidebarGroup key={item.href ?? item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}
