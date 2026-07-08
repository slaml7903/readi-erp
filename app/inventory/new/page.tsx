import Link from "next/link";

import { PageHeader } from "@/components/ui";

export default function InventoryNewPage() {
  return (
    <div className="space-y-6 text-gray-900">
      <Link
        href="/inventory"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← 재고현황 목록
      </Link>

      <PageHeader
        title="재고 등록"
        description="신규 재고를 등록합니다."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          재고 등록 화면은 추후 구현 예정입니다.
        </p>
      </div>
    </div>
  );
}
