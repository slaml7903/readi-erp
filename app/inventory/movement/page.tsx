import { PageHeader } from "@/components/ui";
import InventoryMovementClient from "@/features/inventory/components/InventoryMovementClient";
import {
  fetchInventoryItems,
  fetchInventoryMovements,
} from "@/features/inventory/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function InventoryMovementPage() {
  const [items, movements] = await Promise.all([
    fetchInventoryItems(),
    fetchInventoryMovements(),
  ]);

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader title="재고 입출고" description="구매입고 외 입출고 거래를 조회하고 등록합니다." />
      <InventoryMovementClient initialItems={items} initialMovements={movements} />
    </div>
  );
}
