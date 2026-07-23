import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui";
import PurchaseReceivingReviewClient from "@/features/purchase/components/receiving/PurchaseReceivingReviewClient";
import { fetchReceivingReviewItems } from "@/features/purchase/services/receiving.service";

type PurchaseReceivingPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseReceivingPage({
  searchParams,
}: PurchaseReceivingPageProps) {
  const { q } = await searchParams;
  const receivingItems = await fetchReceivingReviewItems();

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="입고검토"
        description="입고확인 제출 내역과 검토 상태를 조회합니다."
        actions={<Link href="/purchase/receiving/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"><Plus aria-hidden="true" size={16} />입고확인 요청 등록</Link>}
      />

      <PurchaseReceivingReviewClient data={receivingItems} initialSearch={q ?? ""} />
    </div>
  );
}
