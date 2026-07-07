import { Card } from "@/components/ui";

import type { PurchaseRequest } from "../../types/purchase.type";
import OrderSummaryCard from "./OrderSummaryCard";

export default function OrderInfoTab({
  request,
}: {
  request: PurchaseRequest;
}) {
  return (
    <div className="space-y-4">
      {request.orderSummaries && request.orderSummaries.length > 0 ? (
        request.orderSummaries.map((order) => (
          <OrderSummaryCard key={order.id} order={order} />
        ))
      ) : (
        <Card>
          <p className="text-sm text-gray-500">연결된 발주가 없습니다.</p>
        </Card>
      )}
    </div>
  );
}