const menuItems = [
  "Dashboard",
  "구매관리",
  "재고관리",
  "BOM",
  "차량관리",
  "관리자",
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item}
            className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}