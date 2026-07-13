import { PURCHASE_RECEIVING_REVIEW_STATUS } from "../../constants/purchase-status";
import type { PurchaseReceivingSummary } from "../../types/purchase.type";
import { AttachmentList, DetailItem } from "./detail.parts";

export default function ReceivingSummaryCard({
  receiving,
}: {
  receiving: PurchaseReceivingSummary;
}) {
  return (
    <div className="rounded-md bg-gray-50 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">입고확인번호</p>
          <p className="font-medium text-gray-900">{receiving.receivingNo}</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            receiving.reviewCompleted
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {receiving.reviewCompleted
            ? PURCHASE_RECEIVING_REVIEW_STATUS.COMPLETED
            : PURCHASE_RECEIVING_REVIEW_STATUS.PENDING}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="입고확인자" value={receiving.receivingChecker} />
        <DetailItem label="입고확인일" value={receiving.receivingDate} />
      </div>

      <div className="mt-3 space-y-2">
        <AttachmentList
          label="거래명세서"
          files={receiving.transactionStatementFiles}
        />
        <AttachmentList
          label="입고증빙"
          files={receiving.receivingEvidenceFiles}
        />
      </div>

      {receiving.memo && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
          {receiving.memo}
        </p>
      )}
    </div>
  );
}
