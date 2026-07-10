export default function Loading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
        <span className="readi-spinner h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-900" />
        <span>화면을 불러오는 중입니다. 잠시만 기다려 주세요.</span>
      </div>
    </div>
  );
}
