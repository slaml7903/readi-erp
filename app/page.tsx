import { AlertCircle, ArrowRight, Boxes, Building2, ClipboardCheck, FilePlus2, PackageCheck, ReceiptText, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";

import { Card, PageHeader } from "@/components/ui";
import { fetchPortalDashboard } from "@/features/dashboard/services/portal-dashboard.service";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

const quickActions = [
  { href: "/purchase/request/new", title: "구매요청 등록", description: "필요한 품목의 구매를 요청합니다.", icon: FilePlus2 },
  { href: "/purchase/order", title: "발주 조회", description: "발주 진행 상태를 확인합니다.", icon: ShoppingCart },
  { href: "/purchase/receiving/new", title: "입고 등록", description: "도착한 발주의 입고를 등록합니다.", icon: PackageCheck },
  { href: "/purchase/receiving", title: "입고 검토", description: "제출된 입고 내역을 검토합니다.", icon: ClipboardCheck },
  { href: "/purchase/expenses", title: "지출관리", description: "지출 대상과 증빙을 확인합니다.", icon: ReceiptText },
  { href: "/purchase/vendors", title: "거래처 관리", description: "거래처 정보와 서류를 관리합니다.", icon: Building2 },
  { href: "/inventory", title: "재고 조회", description: "현재고와 안전재고를 확인합니다.", icon: Boxes },
];

const metricIcons = [ClipboardCheck, ShoppingCart, Truck, PackageCheck, ReceiptText, Boxes];

export default async function Home() {
  const dashboard = await fetchPortalDashboard();
  const today = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full", timeZone: "Asia/Seoul" }).format(new Date());
  return <div className="space-y-6">
    <PageHeader title="READi 업무 포털" description={`${today} · 구매, 입고, 지출, 재고 업무를 한곳에서 확인합니다.`} />

    {dashboard.unavailableSections.length > 0 ? <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertCircle aria-hidden="true" size={17} /><span>일부 현황을 불러오지 못했습니다: {dashboard.unavailableSections.join(", ")}</span></div> : null}

    <section aria-labelledby="work-status-title">
      <div className="mb-3 flex items-center justify-between"><h2 id="work-status-title" className="text-base font-bold">업무 현황</h2><span className="text-xs text-[var(--text-secondary)]">실제 Airtable 데이터 기준</span></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dashboard.metrics.map((metric, index) => { const Icon = metricIcons[index]; return <Link key={metric.key} href={metric.href} className="group rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)] transition hover:border-[var(--brand-secondary)] hover:shadow-sm"><div className="flex items-start justify-between"><span className="rounded-md bg-[var(--brand-primary-light)] p-2 text-[var(--brand-primary)]"><Icon aria-hidden="true" size={18} /></span><ArrowRight aria-hidden="true" size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-secondary)]" /></div><p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">{metric.label}</p><p className="mt-1 text-2xl font-bold text-[var(--brand-primary)]">{metric.value === undefined ? "-" : `${metric.value.toLocaleString("ko-KR")}건`}</p><p className="mt-1 text-xs text-slate-500">{metric.description}</p></Link>; })}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section aria-labelledby="quick-work-title"><h2 id="quick-work-title" className="mb-3 text-base font-bold">빠른 업무</h2><div className="grid gap-3 sm:grid-cols-2"><QuickActions /></div></section>
      <section aria-labelledby="recent-work-title"><h2 id="recent-work-title" className="mb-3 text-base font-bold">최근 업무</h2><Card className="p-0">{dashboard.recent.length === 0 ? <p className="p-8 text-center text-sm text-[var(--text-secondary)]">표시할 최근 업무가 없습니다.</p> : <ul className="divide-y divide-slate-100">{dashboard.recent.map((item) => <li key={item.id}><Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--brand-primary-light)]"><span className="w-16 shrink-0 rounded-full bg-slate-100 px-2 py-1 text-center text-[11px] font-semibold text-slate-600">{item.category}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-[var(--text-secondary)]">{item.description || "-"}</span></span><time className="shrink-0 text-xs text-slate-400">{item.date ? formatDate(item.date) : "-"}</time></Link></li>)}</ul>}</Card></section>
    </div>
  </div>;
}

function QuickActions() {
  return quickActions.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="group flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-white p-4 transition hover:border-[var(--brand-secondary)] hover:bg-[var(--brand-primary-light)]"><span className="rounded-md bg-[var(--brand-primary)] p-2 text-white"><Icon aria-hidden="true" size={18} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{description}</span></span><ArrowRight aria-hidden="true" size={15} className="mt-1 text-slate-300 group-hover:text-[var(--brand-secondary)]" /></Link>);
}
