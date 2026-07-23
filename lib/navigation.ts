export type NavigationItem = {
  label: string;
  href?: string;
  status?: "ready" | "planned";
  children?: NavigationItem[];
};

export const navigation: NavigationItem[] = [
  { label: "홈", href: "/", status: "ready" },
  { label: "프로젝트", href: "/project", status: "planned" },
  {
    label: "구매관리",
    status: "ready",
    children: [
      { label: "구매요청", href: "/purchase/request", status: "ready" },
      { label: "발주관리", href: "/purchase/order", status: "ready" },
      { label: "입고등록", href: "/purchase/receiving/new", status: "ready" },
      { label: "입고검토", href: "/purchase/receiving", status: "ready" },
      { label: "지출관리", href: "/purchase/expenses", status: "ready" },
      { label: "거래처 관리", href: "/purchase/vendors", status: "ready" },
    ],
  },
  {
    label: "재고관리",
    status: "ready",
    children: [
      { label: "재고현황", href: "/inventory", status: "ready" },
      { label: "재고 입출고", href: "/inventory/movement", status: "ready" },
      { label: "BOM", status: "planned" },
    ],
  },
  {
    label: "인사·총무",
    status: "ready",
    children: [
      { label: "근태관리", href: "/management/attendance", status: "ready" },
      { label: "차량관리", href: "/vehicle", status: "ready" },
      { label: "인사조회", status: "planned" },
    ],
  },
  {
    label: "기준정보",
    status: "planned",
    children: [
      { label: "장비", href: "/equipment", status: "planned" },
      { label: "관리자", href: "/admin", status: "planned" },
    ],
  },
];

export type BreadcrumbItem = { label: string; href?: string };

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const home = { label: "홈", href: "/" };
  if (pathname === "/") return [{ label: "홈" }];

  if (pathname.startsWith("/purchase/request/new")) return [home, purchase(), { label: "구매요청", href: "/purchase/request" }, { label: "신규 등록" }];
  if (pathname.startsWith("/purchase/request")) return [home, purchase(), { label: "구매요청" }];
  if (pathname.startsWith("/purchase/order")) return [home, purchase(), { label: "발주관리" }];
  if (pathname.startsWith("/purchase/receiving/new")) return [home, purchase(), { label: "입고등록" }];
  if (pathname.startsWith("/purchase/receiving")) return [home, purchase(), { label: "입고검토" }];
  if (pathname.startsWith("/purchase/expenses")) return [home, purchase(), { label: "지출관리", href: "/purchase/expenses" }, ...(pathname === "/purchase/expenses" ? [] : [{ label: "상세" }])];
  if (pathname.startsWith("/purchase/vendors/new")) return [home, purchase(), { label: "거래처 관리", href: "/purchase/vendors" }, { label: "신규 등록" }];
  if (pathname.includes("/purchase/vendors/") && pathname.endsWith("/edit")) return [home, purchase(), { label: "거래처 관리", href: "/purchase/vendors" }, { label: "정보 수정" }];
  if (pathname.startsWith("/purchase/vendors")) return [home, purchase(), { label: "거래처 관리" }];
  if (pathname.startsWith("/inventory/movement") || pathname.startsWith("/inventory/new")) return [home, { label: "재고관리", href: "/inventory" }, { label: "재고 입출고" }];
  if (pathname.startsWith("/inventory")) return [home, { label: "재고관리", href: "/inventory" }, { label: "재고현황" }];
  if (pathname.startsWith("/vehicle")) return [home, { label: "인사·총무", href: "/management/attendance" }, { label: "차량관리" }];
  if (pathname.startsWith("/management/attendance")) return [home, { label: "인사·총무", href: "/management/attendance" }, { label: "근태관리" }];
  if (pathname.startsWith("/project")) return [home, { label: "프로젝트" }];
  if (pathname.startsWith("/planned")) return [home, { label: "준비 중" }];
  return [home, { label: "READi 업무 포털" }];
}

function purchase(): BreadcrumbItem {
  return { label: "구매관리", href: "/purchase/request" };
}
