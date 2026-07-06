const menuItems = [
  "Dashboard",
  "구매관리",
  "재고관리",
  "BOM",
  "차량관리",
  "관리자",
];

const dashboardCards = [
  { title: "구매 진행", value: "0건", description: "진행 중인 구매요청" },
  { title: "입고 예정", value: "0건", description: "예상 입고 대상" },
  { title: "재고 부족", value: "0건", description: "안전재고 이하 품목" },
  { title: "차량 예약", value: "0건", description: "금일 예약 현황" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">READi ERP</h1>
          <p className="text-xs text-slate-500">READi ROBUST MACHINE</p>
        </div>

        <div className="text-sm text-slate-500">
          사용자: Admin
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
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

        <section className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">
              구매, 재고, BOM, 차량 현황을 한눈에 확인합니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">최근 업데이트</h3>
            <p className="mt-2 text-sm text-slate-500">
              아직 연결된 데이터가 없습니다. 다음 단계에서 Airtable 연동을 진행합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}