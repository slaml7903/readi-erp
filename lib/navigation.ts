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
    label: "구매",
    status: "ready",
    children: [
      { label: "구매요청", href: "/purchase/request", status: "ready" },
      { label: "발주확인", href: "/purchase/order", status: "ready" },
      { label: "입고확인", href: "/purchase/receiving", status: "ready" },
    ],
  },
  {
    label: "재고",
    status: "ready",
    children: [
      { label: "재고현황", href: "/inventory/status", status: "ready" },
      { label: "재고이동 로그", href: "/inventory/movement", status: "ready" },
    ],
  },
  {
    label: "법인차량",
    href: "/vehicle",
    status: "ready",
  },
  {
    label: "장비관리",
    href: "/equipment",
    status: "planned",
  },
  {
    label: "프로젝트관리",
    href: "/project",
    status: "planned",
  },
  {
    label: "인사 HR",
    href: "/hr",
    status: "planned",
  },
  {
    label: "관리자",
    href: "/admin",
    status: "ready",
  },
];