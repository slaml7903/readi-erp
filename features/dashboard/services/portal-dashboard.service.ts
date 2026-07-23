import "server-only";

import { compareLatestFirst } from "@/lib/sort";
import { fetchInventoryItems } from "@/features/inventory/services/inventory.service";
import { EXPENSE_STATUS } from "@/features/purchase/config/expense.config";
import { PURCHASE_ORDER_STATUS, PURCHASE_REQUEST_STATUS, type PurchaseOrderStatus } from "@/features/purchase/constants/purchase-status";
import { fetchExpenses, parseExpenseFilters } from "@/features/purchase/services/expense.service";
import { fetchPurchaseRequests } from "@/features/purchase/services/purchase.service";
import { fetchReceivingReviewItems, fetchReceivingSelectionData } from "@/features/purchase/services/receiving.service";

export type PortalMetric = { key: string; label: string; description: string; href: string; value?: number };
export type PortalRecentItem = { id: string; category: string; title: string; description?: string; date?: string; href: string };
export type PortalDashboardData = { metrics: PortalMetric[]; recent: PortalRecentItem[]; unavailableSections: string[] };

export async function fetchPortalDashboard(): Promise<PortalDashboardData> {
  const tasks = await Promise.allSettled([
    fetchPurchaseRequests(),
    fetchReceivingSelectionData(),
    fetchReceivingReviewItems(),
    fetchExpenses(parseExpenseFilters({ status: EXPENSE_STATUS.waiting })),
    fetchExpenses(parseExpenseFilters({ status: EXPENSE_STATUS.completed })),
    fetchInventoryItems(),
  ]);
  const [requestsResult, receivingSelectionResult, receivingReviewResult, waitingExpensesResult, completedExpensesResult, inventoryResult] = tasks;
  const requests = fulfilled(requestsResult);
  const receivingSelection = fulfilled(receivingSelectionResult);
  const receivingReviews = fulfilled(receivingReviewResult);
  const waitingExpenses = fulfilled(waitingExpensesResult);
  const completedExpenses = fulfilled(completedExpensesResult);
  const inventory = fulfilled(inventoryResult);

  const orders = requests ? uniqueById(requests.flatMap((request) => request.orderSummaries ?? [])) : undefined;
  const activeOrderStatuses = new Set<PurchaseOrderStatus>([PURCHASE_ORDER_STATUS.BEFORE_ORDER, PURCHASE_ORDER_STATUS.PRE_PURCHASE, PURCHASE_ORDER_STATUS.ORDERED, PURCHASE_ORDER_STATUS.SHIPPING, PURCHASE_ORDER_STATUS.HOLD]);
  const unavailableSections = [
    !requests && "구매요청·발주", !receivingSelection && "입고대기", !receivingReviews && "입고검토",
    !waitingExpenses && "지출", !inventory && "재고",
  ].filter((value): value is string => Boolean(value));

  const metrics: PortalMetric[] = [
    { key: "requests", label: "검토대기 구매요청", description: "요청됨 상태", href: "/purchase/request", value: requests?.filter((request) => request.status === PURCHASE_REQUEST_STATUS.REQUESTED).length },
    { key: "orders", label: "발주 진행", description: "입고완료·취소 제외", href: "/purchase/order", value: orders?.filter((order) => order.status && activeOrderStatuses.has(order.status)).length },
    { key: "receiving", label: "입고대기", description: "입고 가능한 발주", href: "/purchase/receiving/new", value: receivingSelection?.orders.filter((order) => order.status !== PURCHASE_ORDER_STATUS.RECEIVED && order.status !== PURCHASE_ORDER_STATUS.CANCELLED).length },
    { key: "review", label: "입고검토대기", description: "검토완료 전 제출", href: "/purchase/receiving", value: receivingReviews?.filter((item) => !item.reviewCompleted).length },
    { key: "expenses", label: "지출대기", description: "지출완료 전 발주", href: "/purchase/expenses", value: waitingExpenses?.total },
    { key: "inventory", label: "발주 필요 재고", description: "안전재고 이하 품목", href: "/inventory", value: inventory?.filter((item) => item.status === "발주필요").length },
  ];

  const recent = [
    ...(requests?.slice(0, 5).map((request) => ({ id: `request-${request.id}`, category: "구매요청", title: request.prNo || request.title || "구매요청", description: request.title, date: request.requestDate ?? request.createdTime, href: "/purchase/request" })) ?? []),
    ...(orders?.sort((a, b) => compareLatestFirst({ id: a.id, date: a.orderDate, createdTime: a.createdTime }, { id: b.id, date: b.orderDate, createdTime: b.createdTime })).slice(0, 5).map((order) => ({ id: `order-${order.id}`, category: "발주", title: order.poNo || "발주", description: order.vendorNames?.join(", "), date: order.orderDate ?? order.createdTime, href: "/purchase/order" })) ?? []),
    ...(receivingReviews?.slice(0, 5).map((item) => ({ id: `receiving-${item.id}`, category: "입고", title: item.receivingNo || "입고확인", description: item.poNos?.join(", "), date: item.receivingDate ?? item.createdTime, href: "/purchase/receiving" })) ?? []),
    ...(completedExpenses?.items.slice(0, 5).map((expense) => ({ id: `expense-${expense.id}`, category: "지출완료", title: expense.orderNumber || "지출", description: expense.vendorNames.join(", "), date: expense.orderDate ?? expense.createdTime, href: `/purchase/expenses/${expense.id}` })) ?? []),
  ].sort((a, b) => compareLatestFirst({ id: a.id, date: a.date }, { id: b.id, date: b.date })).slice(0, 8);

  return { metrics, recent, unavailableSections };
}

function fulfilled<T>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === "fulfilled" ? result.value : undefined;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}
