import { Card, StatusBadge } from "@/components/ui";

import type { PurchaseOrderSummary } from "../../types/purchase.type";
import { AttachmentList, DetailItem, DetailList } from "./detail.parts";
import OrderItemCard from "./OrderItemCard";
import ReceivingSummaryCard from "./ReceivingSummaryCard";

export default function OrderSummaryCard({
  order,
}: {
  order: PurchaseOrderSummary;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">발주번호</p>
          <p className="font-semibold text-gray-900">{order.poNo}</p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailItem label="발주일" value={order.orderDate} />
        <DetailItem label="예상 입고일" value={order.expectedReceivingDate} />
        <DetailItem label="입고확인자" value={order.receivingChecker} />
        <DetailItem
          label="공급가액"
          value={`${order.totalAmount?.toLocaleString() ?? 0}원`}
        />
        <DetailItem
          label="지출필요"
          value={order.needPayment ? "필요" : "해당없음"}
        />
        <DetailItem
          label="지출완료"
          value={order.paymentCompleted ? "완료" : "미완료"}
        />
      </div>

      <div className="mt-4">
        <DetailList label="벤더" values={order.vendorNames} />
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <AttachmentList label="발주서" files={order.purchaseOrderFiles} />
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-semibold text-gray-600">
          발주상세품목
        </p>

        {order.orderItems && order.orderItems.length > 0 ? (
          <div className="space-y-2">
            {order.orderItems.map((item) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">발주상세품목이 없습니다.</p>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-semibold text-gray-600">입고 정보</p>

        {order.receivingSummaries && order.receivingSummaries.length > 0 ? (
          <div className="space-y-2">
            {order.receivingSummaries.map((receiving) => (
              <ReceivingSummaryCard
                key={receiving.id}
                receiving={receiving}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">입고확인 내역이 없습니다.</p>
        )}
      </div>
    </Card>
  );
}