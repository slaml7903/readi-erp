"use client";

import { useState } from "react";

import type { PurchaseRequest } from "../../types/purchase.type";
import AttachmentsTab from "./AttachmentsTab";
import { TabButton } from "./detail.parts";
import OrderInfoTab from "./OrderInfoTab";
import RequestInfoTab from "./RequestInfoTab";

type DetailTab = "request" | "attachments" | "order";

interface PurchaseRequestDetailProps {
  request: PurchaseRequest;
}

export default function PurchaseRequestDetail({
  request,
}: PurchaseRequestDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("request");

  return (
    <div className="space-y-4 text-gray-900">
      <div className="sticky top-0 z-10 bg-white pb-3">
        <div className="mb-3">
          <p className="text-sm text-gray-500">PR NO.</p>
          <p className="text-lg font-semibold text-gray-900">{request.prNo}</p>
          <p className="mt-1 text-sm text-gray-600">{request.title}</p>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <TabButton
            active={activeTab === "request"}
            onClick={() => setActiveTab("request")}
          >
            요청정보
          </TabButton>

          <TabButton
            active={activeTab === "attachments"}
            onClick={() => setActiveTab("attachments")}
          >
            첨부파일
          </TabButton>

          <TabButton
            active={activeTab === "order"}
            onClick={() => setActiveTab("order")}
          >
            발주/입고
          </TabButton>
        </div>
      </div>

      {activeTab === "request" && <RequestInfoTab request={request} />}
      {activeTab === "attachments" && <AttachmentsTab request={request} />}
      {activeTab === "order" && <OrderInfoTab request={request} />}
    </div>
  );
}