import { PageHeader } from "@/components/ui";
import PurchaseOrderList from "@/features/purchase/components/PurchaseOrderList";
import { fetchPurchaseRequests } from "@/features/purchase/services/purchase.service";

type PurchaseOrderPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseOrderPage({
  searchParams,
}: PurchaseOrderPageProps) {
  const { q } = await searchParams;
  const purchaseRequests = await fetchPurchaseRequests();

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="발주관리"
        description="발주 목록을 확인하고 입고확인을 제출합니다."
      />

      <PurchaseOrderList requests={purchaseRequests} initialSearch={q ?? ""} />
    </div>
  );
}
