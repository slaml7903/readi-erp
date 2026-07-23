"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { navigation, type NavigationItem } from "@/lib/navigation";

function hasActivePath(item: NavigationItem, pathname: string): boolean {
  if (item.href) return item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return Boolean(item.children?.some((child) => hasActivePath(child, pathname)));
}

function itemKey(parent: string, item: NavigationItem) {
  return `${parent}/${item.href ?? item.label}`;
}

function initialOpenKeys(items: NavigationItem[], pathname: string) {
  return new Set(items.filter((item) => item.children?.length && hasActivePath(item, pathname)).map((item) => itemKey("root", item)));
}

export default function Sidebar() {
  const pathname = usePathname();
  return <NavigationContent key={pathname} pathname={pathname} />;
}

function NavigationContent({ pathname }: { pathname: string }) {
  const [openKeys, setOpenKeys] = useState(() => initialOpenKeys(navigation, pathname));
  const [desktopOpenKey, setDesktopOpenKey] = useState<string>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = (key: string) => setOpenKeys((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="bg-[var(--brand-primary)] text-white">
      <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="portal-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-11 w-full items-center gap-2 text-sm font-semibold md:hidden"
        >
          {mobileOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
          전체 메뉴
        </button>

        <nav aria-label="전사 주요 메뉴" className="hidden h-11 items-stretch gap-1 md:flex">
          {navigation.map((item) => {
            const key = itemKey("root", item);
            return <DesktopItem key={key} item={item} itemKey={key} pathname={pathname} open={desktopOpenKey === key} onOpen={() => setDesktopOpenKey(key)} onClose={() => setDesktopOpenKey(undefined)} onToggle={() => setDesktopOpenKey((current) => current === key ? undefined : key)} />;
          })}
        </nav>

        {mobileOpen ? (
          <nav id="portal-mobile-navigation" aria-label="모바일 전사 메뉴" className="space-y-1 border-t border-white/15 py-3 md:hidden">
            {navigation.map((item) => {
              const key = itemKey("root", item);
              const open = openKeys.has(key);
              return (
                <div key={key}>
                  {item.children?.length ? (
                    <button type="button" aria-expanded={open} onClick={() => toggle(key)} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold ${hasActivePath(item, pathname) ? "bg-white/15" : "hover:bg-white/10"}`}>
                      {item.label}<ChevronRight aria-hidden="true" size={17} className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`} />
                    </button>
                  ) : <NavigationLink item={item} active={hasActivePath(item, pathname)} onNavigate={() => setMobileOpen(false)} />}
                  {open ? <div className="ml-3 border-l border-white/20 pl-2">{item.children?.map((child) => <NavigationLink key={itemKey(key, child)} item={child} active={hasActivePath(child, pathname)} onNavigate={() => setMobileOpen(false)} />)}</div> : null}
                </div>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function DesktopItem({ item, itemKey: key, pathname, open, onOpen, onClose, onToggle }: { item: NavigationItem; itemKey: string; pathname: string; open: boolean; onOpen: () => void; onClose: () => void; onToggle: () => void }) {
  const panelId = useId();
  const active = hasActivePath(item, pathname);
  if (!item.children?.length) {
    const href = item.href ?? `/planned?menu=${encodeURIComponent(item.label)}`;
    return <Link href={href} className={`flex items-center border-b-2 px-4 text-sm font-semibold transition-colors ${active ? "border-[var(--brand-accent)] bg-white/10 text-white" : "border-transparent text-white/85 hover:bg-white/10 hover:text-white"}`}>{item.label}{item.status === "planned" ? <Planned /> : null}</Link>;
  }
  return (
    <div
      className="relative flex"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose();
      }}
    >
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle} className={`flex items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${active ? "border-[var(--brand-accent)] bg-white/10" : "border-transparent text-white/85 hover:bg-white/10 hover:text-white"}`}>
        {item.label}<ChevronRight aria-hidden="true" size={16} className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`} />
      </button>
      {open ? (
        <div id={panelId} className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-md border border-slate-200 bg-white p-1.5 text-[var(--text-primary)] shadow-lg">
          {item.children.map((child) => <NavigationLink key={itemKey(key, child)} item={child} active={hasActivePath(child, pathname)} />)}
        </div>
      ) : null}
    </div>
  );
}

function NavigationLink({ item, active, onNavigate }: { item: NavigationItem; active: boolean; onNavigate?: () => void }) {
  const href = item.href ?? `/planned?menu=${encodeURIComponent(item.label)}`;
  return (
    <Link href={href} prefetch={Boolean(item.href)} onClick={onNavigate} className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm ${active ? "bg-[var(--brand-primary-light)] font-semibold text-[var(--brand-primary)]" : "text-inherit hover:bg-slate-100"}`}>
      <span>{item.label}</span>{item.status === "planned" ? <Planned /> : null}
    </Link>
  );
}

function Planned() {
  return <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">준비 중</span>;
}
