import { Card, StatusBadge } from "@/components/ui";

import type { PurchaseRequest } from "../../types/purchase.type";
import { DetailItem, DetailList } from "./detail.parts";

export default function RequestInfoTab({
  request,
}: {
  request: PurchaseRequest;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          기본 정보
        </h3>

        <div className="space-y-4">
          <DetailItem label="PR NO." value={request.prNo} />
          <DetailItem label="제목" value={request.title} />

          <div>
            <p className="text-xs text-gray-500">상태</p>
            <div className="mt-1">
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          요청 정보
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <DetailItem label="팀명" value={request.teamName} />
          <DetailItem label="요청자" value={request.requester} />
          <DetailItem label="요청일" value={request.requestDate} />
          <DetailItem label="필요일자" value={request.requiredDate} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          연계 정보
        </h3>

        <div className="space-y-3 text-sm">
          <DetailList label="프로젝트" values={request.projectNames} />
          <DetailList label="벤더" values={request.vendorNames} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          금액 정보
        </h3>

        <DetailItem
          label="지출액"
          value={`${request.totalAmount?.toLocaleString() ?? 0}원`}
        />
      </Card>

      {request.memo && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">비고</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {request.memo}
          </p>
        </Card>
      )}
    </div>
  );
}