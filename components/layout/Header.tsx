import Image from "next/image";
import Link from "next/link";

import GlobalSearch from "./GlobalSearch";
import Sidebar from "./Sidebar";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-white shadow-[0_1px_3px_rgba(0,55,85,0.08)]">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="READi 업무 포털 홈">
          <Image
            src="/brand/readi-logo.png"
            alt="READi Robust Machine"
            width={1295}
            height={391}
            priority
            className="h-8 w-auto shrink-0 object-contain"
          />
          <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-[var(--brand-primary)] sm:inline">
            업무 포털
          </span>
        </Link>
        <div className="min-w-0 flex-1 sm:max-w-[460px]">
          <GlobalSearch />
        </div>
      </div>
      <Sidebar />
    </header>
  );
}
