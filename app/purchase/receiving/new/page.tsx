import Link from "next/link";
import { PageHeader } from "@/components/ui";
import PurchaseReceivingSubmitForm from "@/features/purchase/components/receiving/PurchaseReceivingSubmitForm";
import { fetchReceivingSelectionData } from "@/features/purchase/services/receiving.service";

export const dynamic = "force-dynamic";

export default async function PurchaseReceivingNewPage() {
  const data = await fetchReceivingSelectionData();

  return (
    <div className="space-y-6 text-gray-900">
      <Link
        href="/purchase/receiving"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
        ← 입고검토 목록
      </Link>

      <PageHeader
        title="입고확인 요청 등록"
        description="구매요청, 발주, 발주상세품목을 순서대로 선택해 RCV를 생성합니다."
      />

      <PurchaseReceivingSubmitForm data={data} />
    </div>
  );
}
