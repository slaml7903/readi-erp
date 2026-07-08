export type NavigationItem = {
  label: string;
  href?: string;
  status?: "ready" | "planned";
  children?: NavigationItem[];
};

export const navigation: NavigationItem[] = [
  {
    label: "Dashboard",
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
        ],
      },
      {
        label: "재고",
        status: "ready",
        children: [
          { label: "재고현황", href: "/inventory", status: "ready" },
          { label: "재고 등록", href: "/inventory/new", status: "ready" },
          { label: "재고 입출고", href: "/inventory/movement", status: "ready" },
          { label: "BOM", status: "planned" },
        ],
      },
      {
        label: "프로젝트",
        status: "ready",
        children: [
          { label: "프로젝트 목록", href: "/project", status: "ready" },
          { label: "일정", status: "planned" },
          { label: "원가", status: "planned" },
          { label: "장비", href: "/equipment", status: "ready" },
        ],
      },
      {
        label: "장비",
        status: "ready",
        children: [
          { label: "장비현황", href: "/equipment", status: "ready" },
          { label: "IoT", status: "planned" },
          { label: "정비이력", status: "planned" },
        ],
      },
    ],
  },
  {
    label: "기준정보",
    status: "planned",
    children: [
      { label: "거래처", status: "planned" },
      { label: "품목", status: "planned" },
      { label: "프로젝트 유형", status: "planned" },
      { label: "공통코드", status: "planned" },
      { label: "사용자", status: "planned" },
    ],
  },
  {
    label: "업무지원",
    status: "planned",
    children: [
      { label: "업무공지", status: "planned" },
      { label: "업무가이드", status: "planned" },
      { label: "보고서", href: "/purchase/dashboard", status: "ready" },
      { label: "회의록", status: "planned" },
      { label: "문서관리", status: "planned" },
    ],
  },
  {
    label: "관리",
    status: "planned",
    children: [
      { label: "차량관리", href: "/vehicle", status: "ready" },
      { label: "자산관리", status: "planned" },
      { label: "교육관리", status: "planned" },
      { label: "규정관리", status: "planned" },
      { label: "권한관리", status: "planned" },
    ],
  },
  {
    label: "시스템",
    status: "planned",
    children: [
      { label: "설정", status: "planned" },
      { label: "로그", status: "planned" },
      { label: "관리자", href: "/admin", status: "ready" },
    ],
  },
];

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") return [{ label: "Dashboard", href: "/" }];

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

  if (pathname.startsWith("/inventory/new")) {
    return [
      { label: "운영", href: "/inventory" },
      { label: "재고", href: "/inventory" },
      { label: "재고 등록" },
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

  if (pathname.startsWith("/planned")) {
    return [{ label: "준비중" }];
  }

  return [{ label: "READi ERP" }];
}
