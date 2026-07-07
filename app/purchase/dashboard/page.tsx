import { PageHeader } from "@/components/ui";

export default function PurchaseDashboardPage() {
  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="구매 대시보드"
        description="구매 현황과 주요 지표를 확인합니다."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          구매 대시보드 화면은 추후 구현 예정입니다.
        </p>
      </div>
    </div>
  );
}