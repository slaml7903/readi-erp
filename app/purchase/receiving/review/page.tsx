import { PageHeader } from "@/components/ui";
import PurchaseReceivingReviewClient from "@/features/purchase/components/receiving/PurchaseReceivingReviewClient";
import { fetchReceivingReviewItems } from "@/features/purchase/services/receiving.service";

type PurchaseReceivingReviewPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseReceivingReviewPage({
  searchParams,
}: PurchaseReceivingReviewPageProps) {
  const { q } = await searchParams;
  const receivingItems = await fetchReceivingReviewItems();

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="입고확인 검토"
        description="입고확인 내용을 확인하고 검토완료 처리합니다."
      />

      <PurchaseReceivingReviewClient data={receivingItems} initialSearch={q ?? ""} />
    </div>
  );
}
