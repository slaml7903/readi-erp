export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">READi ERP</h1>
        <p className="text-xs text-slate-500">READi ROBUST MACHINE</p>
      </div>

      <div className="text-sm text-slate-500">사용자: Admin</div>
    </header>
  );
}