import Link from "next/link";
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
        description="입고확인 제출 내역을 조회하고 검토완료 처리합니다."
      />

      <div className="flex justify-end">
        <Link
          href="/purchase/receiving/new"
          className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800"
        >
          입고확인 요청 등록
        </Link>
      </div>

      <PurchaseReceivingReviewClient data={receivingItems} initialSearch={q ?? ""} />
    </div>
  );
}
