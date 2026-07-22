import { PageHeader } from "@/components/ui";
import InventoryClient from "@/features/inventory/components/InventoryClient";
import { fetchInventoryItems } from "@/features/inventory/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await fetchInventoryItems();

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="재고현황"
        description="ITEM MASTER 기준 현재고와 안전재고를 확인합니다."
      />
      <InventoryClient items={items} />
    </div>
  );
}
