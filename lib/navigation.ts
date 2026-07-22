export type NavigationItem = {
  label: string;
  href?: string;
  status?: "ready" | "planned";
  children?: NavigationItem[];
};

export const navigation: NavigationItem[] = [
  {
    label: "대시보드",
    href: "/",
    status: "ready",
  },
  {
    label: "운영",
    status: "ready",
    children: [
      {
        label: "구매",
        status: "ready",
        children: [
          { label: "구매요청", href: "/purchase/request", status: "ready" },
          { label: "발주관리", href: "/purchase/order", status: "ready" },
          { label: "입고검토", href: "/purchase/receiving", status: "ready" },
          { label: "지출관리", status: "planned" },
          { label: "거래처", status: "planned" },
        ],
      },
      {
        label: "재고",
        status: "ready",
        children: [
          { label: "재고현황", href: "/inventory", status: "ready" },
          { label: "재고 입출고", href: "/inventory/movement", status: "ready" },
          { label: "BOM", status: "planned" },
        ],
      },
      {
        label: "장비",
        status: "planned",
        children: [
          { label: "KIT", status: "planned" },
          { label: "굴착기", status: "planned" },
        ],
      },
      {
        label: "프로젝트",
        status: "planned",
        children: [
          { label: "A", status: "planned" },
          { label: "B", status: "planned" },
        ],
      },
    ],
  },
  {
    label: "업무지원",
    status: "planned",
    children: [
      { label: "업무메뉴얼", status: "planned" },
      { label: "사내규정", status: "planned" },
      { label: "양식", status: "planned" },
    ],
  },
  {
    label: "관리",
    status: "ready",
    children: [
      { label: "차량관리", href: "/vehicle", status: "ready" },
      { label: "근태관리", href: "/management/attendance", status: "ready" },
      { label: "인사조회", status: "planned" },
    ],
  },
  {
    label: "시스템",
    status: "planned",
    children: [
      { label: "설정", status: "planned" },
      { label: "로그", status: "planned" },
      { label: "관리자", status: "planned" },
    ],
  },
];

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") return [{ label: "대시보드", href: "/" }];

  if (pathname.startsWith("/purchase/request/new")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "구매요청", href: "/purchase/request" },
      { label: "구매요청 등록" },
    ];
  }

  if (pathname.startsWith("/purchase/request")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "구매요청" },
    ];
  }

  if (pathname.startsWith("/purchase/order")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "발주관리" },
    ];
  }

  if (pathname.startsWith("/purchase/receiving/new")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "입고검토", href: "/purchase/receiving" },
      { label: "입고확인 등록" },
    ];
  }

  if (pathname.startsWith("/purchase/receiving/review")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "입고검토" },
    ];
  }

  if (pathname.startsWith("/purchase/receiving")) {
    return [
      { label: "운영", href: "/purchase/request" },
      { label: "구매", href: "/purchase/request" },
      { label: "입고검토" },
    ];
  }

  if (pathname.startsWith("/inventory/movement") || pathname.startsWith("/inventory/new")) {
    return [
      { label: "운영", href: "/inventory" },
      { label: "재고", href: "/inventory" },
      { label: "재고 입출고" },
    ];
  }

  if (pathname.startsWith("/inventory")) {
    return [
      { label: "운영", href: "/inventory" },
      { label: "재고", href: "/inventory" },
      { label: "재고현황" },
    ];
  }

  if (pathname.startsWith("/project")) {
    return [
      { label: "운영", href: "/project" },
      { label: "프로젝트" },
    ];
  }

  if (pathname.startsWith("/management/attendance")) {
    return [
      { label: "관리", href: "/management/attendance" },
      { label: "근태관리" },
    ];
  }

  if (pathname.startsWith("/vehicle")) {
    return [
      { label: "관리", href: "/vehicle" },
      { label: "차량관리" },
    ];
  }

  if (pathname.startsWith("/planned")) {
    return [{ label: "준비중" }];
  }

  return [{ label: "READi ERP" }];
}
