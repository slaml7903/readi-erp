import { PageHeader } from "@/components/ui";
import PurchaseRequestCreateForm from "@/features/purchase/components/create/PurchaseRequestCreateForm";

export default function PurchaseRequestNewPage() {
  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="구매요청 등록"
        description="신규 구매요청 정보를 입력합니다."
      />

      <PurchaseRequestCreateForm />
    </div>
  );
}