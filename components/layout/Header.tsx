import Breadcrumb from "./Breadcrumb";
import GlobalSearch from "./GlobalSearch";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          READi ERP
        </h1>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <GlobalSearch />
        <div className="text-sm text-slate-500">사용자: Admin</div>
      </div>
    </header>
  );
}
