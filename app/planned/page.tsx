import Link from "next/link";

import { PageHeader } from "@/components/ui";

type PlannedPageProps = {
  searchParams: Promise<{
    menu?: string;
  }>;
};

export default async function PlannedPage({ searchParams }: PlannedPageProps) {
  const { menu } = await searchParams;
  const menuName = menu ? decodeURIComponent(menu) : "준비중";

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title={`${menuName} 준비중`}
        description="현재 메뉴는 구조만 연결되어 있으며 추후 구현 예정입니다."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          전사 ERP 메뉴 구조 확장을 위해 준비중 페이지로 연결했습니다.
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex h-10 items-center rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          Dashboard로 이동
        </Link>
      </div>
    </div>
  );
}
