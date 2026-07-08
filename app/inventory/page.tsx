import { PageHeader } from "@/components/ui";

export default function InventoryPage() {
  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="재고현황"
        description="재고 현황을 확인합니다."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          재고현황 화면은 추후 구현 예정입니다.
        </p>
      </div>
    </div>
  );
}
