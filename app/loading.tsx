export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="화면을 불러오는 중입니다" role="status">
      <div className="space-y-2 border-b border-slate-200 pb-4"><div className="h-7 w-44 rounded bg-slate-200" /><div className="h-4 w-80 max-w-full rounded bg-slate-200" /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-lg border border-slate-200 bg-white p-4"><div className="h-4 w-24 rounded bg-slate-200" /><div className="mt-4 h-7 w-16 rounded bg-slate-200" /></div>)}</div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="h-11 bg-slate-100" />{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-12 border-t border-slate-100" />)}</div>
      <span className="sr-only">잠시만 기다려 주세요.</span>
    </div>
  );
}
