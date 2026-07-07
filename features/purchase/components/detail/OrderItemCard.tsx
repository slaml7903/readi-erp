import type { PurchaseOrderItemSummary } from "../../types/purchase.type";
import { DetailItem } from "./detail.parts";

export default function OrderItemCard({
  item,
}: {
  item: PurchaseOrderItemSummary;
}) {
  return (
    <div className="rounded-md bg-gray-50 p-3 text-sm">
      <div className="mb-3">
        <p className="text-xs text-gray-500">발주상세</p>
        <p className="font-semibold text-gray-900">{item.modelName || "-"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="품목" value={item.itemNames?.join(", ")} />
        <DetailItem label="벤더" value={item.vendorNames?.join(", ")} />
        <DetailItem label="수량" value={item.quantity} />
        <DetailItem
          label="단가"
          value={`${item.unitPrice?.toLocaleString() ?? 0}원`}
        />
        <DetailItem
          label="총액"
          value={`${item.amount?.toLocaleString() ?? 0}원`}
        />
        <DetailItem
          label="공급가액"
          value={`${item.supplyAmount?.toLocaleString() ?? 0}원`}
        />
        <DetailItem
          label="부가세"
          value={`${item.vatAmount?.toLocaleString() ?? 0}원`}
        />
        <DetailItem
          label="VAT 포함"
          value={item.vatIncluded ? "포함" : "미포함"}
        />
      </div>

      {item.memo && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
          {item.memo}
        </p>
      )}
    </div>
  );
}