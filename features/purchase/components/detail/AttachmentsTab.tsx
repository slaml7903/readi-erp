import { Card } from "@/components/ui";

import type { PurchaseRequest } from "../../types/purchase.type";
import { AttachmentList } from "./detail.parts";

export default function AttachmentsTab({
  request,
}: {
  request: PurchaseRequest;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          구매요청 첨부파일
        </h3>

        <div className="space-y-4 text-sm">
          <AttachmentList label="PR 승인" files={request.approvalFiles} />
          <AttachmentList
            label="구매요청서"
            files={request.requestFormFiles}
          />
          <AttachmentList label="견적서" files={request.quotationFiles} />
        </div>
      </Card>
    </div>
  );
}