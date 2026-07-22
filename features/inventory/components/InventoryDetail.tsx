import { Drawer, StatusBadge } from "@/components/ui";
import type { InventoryItem } from "../types/inventory.type";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-gray-100 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="break-words font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default function InventoryDetail({
  item,
  onClose,
}: {
  item?: InventoryItem;
  onClose: () => void;
}) {
  return (
    <Drawer open={Boolean(item)} title="품목 상세" onClose={onClose} width="w-full sm:w-[520px]">
      {item ? (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500">{item.itemCode || "품목코드 없음"}</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{item.itemName || "품명 없음"}</h3>
            <div className="mt-3"><StatusBadge status={item.status} /></div>
          </div>

          <dl>
            <DetailRow label="규격/모델/사양" value={item.specification || "-"} />
            <DetailRow label="메인거래처" value={item.vendor || "-"} />
            <DetailRow label="관리부서" value={item.department || "-"} />
            <DetailRow label="표준단가" value={item.standardUnitPrice ? `${item.standardUnitPrice.toLocaleString("ko-KR")}원` : "-"} />
            <DetailRow label="구매입고수량" value={item.purchaseReceivedQuantity.toLocaleString("ko-KR")} />
            <DetailRow label="생산입출고수량" value={item.movementQuantity.toLocaleString("ko-KR")} />
            <DetailRow label="현재고" value={item.currentStock.toLocaleString("ko-KR")} />
            <DetailRow label="안전재고" value={item.safetyStock?.toLocaleString("ko-KR") ?? "-"} />
          </dl>
        </div>
      ) : null}
    </Drawer>
  );
}

