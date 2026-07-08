import { PageHeader } from "@/components/ui";
import PurchaseRequestClient from "@/features/purchase/components/PurchaseRequestClient";
import { fetchPurchaseRequests } from "@/features/purchase/services/purchase.service";

type PurchaseRequestPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseRequestPage({
  searchParams,
}: PurchaseRequestPageProps) {
  const { q } = await searchParams;
  const purchaseRequests = await fetchPurchaseRequests();

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="구매요청"
        description="구매요청 접수 현황을 확인합니다."
      />

      <PurchaseRequestClient data={purchaseRequests} initialSearch={q ?? ""} />
    </div>
  );
}
