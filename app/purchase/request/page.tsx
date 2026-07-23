import { PageHeader } from "@/components/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
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
        actions={<Link href="/purchase/request/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"><Plus aria-hidden="true" size={16} />구매요청 등록</Link>}
      />

      <PurchaseRequestClient data={purchaseRequests} initialSearch={q ?? ""} />
    </div>
  );
}
