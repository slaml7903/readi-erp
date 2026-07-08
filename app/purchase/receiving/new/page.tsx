import Link from "next/link";
import { PageHeader } from "@/components/ui";
import PurchaseReceivingSubmitForm from "@/features/purchase/components/receiving/PurchaseReceivingSubmitForm";
import { fetchReceivingOrderDetail } from "@/features/purchase/services/receiving.service";

type PurchaseReceivingNewPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function PurchaseReceivingNewPage({
  searchParams,
}: PurchaseReceivingNewPageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="space-y-6 text-gray-900">
        <Link
          href="/purchase/receiving"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← 입고검토 목록
        </Link>

        <PageHeader
          title="입고확인 제출"
          description="입고확인할 발주가 선택되지 않았습니다."
        />
      </div>
    );
  }

  const order = await fetchReceivingOrderDetail(orderId);

  return (
    <div className="space-y-6 text-gray-900">
      <Link
        href="/purchase/receiving"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
        ← 입고검토 목록
      </Link>

      <PageHeader
        title="입고확인 제출"
        description="입고확인 제출은 RCV 레코드만 생성하며 발주 상태는 변경하지 않습니다."
      />

      <PurchaseReceivingSubmitForm order={order} />
    </div>
  );
}
