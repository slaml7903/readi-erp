import { fetchReceivingReviewItems } from "@/features/purchase/services/receiving.service";
import { fetchPurchaseRequests } from "@/features/purchase/services/purchase.service";

export type GlobalSearchResult = {
  id: string;
  type: "purchase-request" | "purchase-order" | "receiving";
  label: string;
  description: string;
  href: string;
};

function includesKeyword(values: Array<string | undefined>, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) return false;

  return values.some((value) =>
    value?.toLowerCase().includes(normalizedKeyword)
  );
}

export async function searchGlobalData(
  keyword: string
): Promise<GlobalSearchResult[]> {
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword.length < 2) return [];

  const [purchaseRequests, receivingItems] = await Promise.all([
    fetchPurchaseRequests(),
    fetchReceivingReviewItems(),
  ]);

  const purchaseRequestResults: GlobalSearchResult[] = purchaseRequests
    .filter((request) =>
      includesKeyword(
        [
          request.prNo,
          request.title,
          request.teamName,
          request.requester,
          request.status,
          request.projectNames?.join(", "),
          request.vendorNames?.join(", "),
        ],
        trimmedKeyword
      )
    )
    .map((request) => ({
      id: request.id,
      type: "purchase-request",
      label: request.prNo || request.title || "구매요청",
      description: request.title,
      href: `/purchase/request?q=${encodeURIComponent(trimmedKeyword)}`,
    }));

  const purchaseOrderResults: GlobalSearchResult[] = purchaseRequests.flatMap(
    (request) =>
      (request.orderSummaries ?? [])
        .filter((order) =>
          includesKeyword(
            [
              order.poNo,
              order.title,
              order.status,
              order.receivingChecker,
              order.expectedReceivingDate,
              order.vendorNames?.join(", "),
              request.prNo,
              request.title,
            ],
            trimmedKeyword
          )
        )
        .map((order) => ({
          id: order.id,
          type: "purchase-order" as const,
          label: order.poNo || "발주",
          description: order.title || request.title,
          href: `/purchase/order?q=${encodeURIComponent(trimmedKeyword)}`,
        }))
  );

  const receivingResults: GlobalSearchResult[] = receivingItems
    .filter((receiving) =>
      includesKeyword(
        [
          receiving.receivingNo,
          receiving.poNos?.join(", "),
          receiving.title,
          receiving.receivingChecker,
          receiving.receivingDate,
          receiving.reviewCompleted ? "검토완료" : "검토대기",
        ],
        trimmedKeyword
      )
    )
    .map((receiving) => ({
      id: receiving.id,
      type: "receiving",
      label: receiving.receivingNo || "입고확인",
      description: receiving.title || receiving.poNos?.join(", ") || "",
      href: `/purchase/receiving?q=${encodeURIComponent(trimmedKeyword)}`,
    }));

  return [
    ...purchaseRequestResults,
    ...purchaseOrderResults,
    ...receivingResults,
  ].slice(0, 12);
}
