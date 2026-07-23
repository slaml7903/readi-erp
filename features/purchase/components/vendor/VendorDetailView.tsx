"use client";

import { Card, EmptyState } from "@/components/ui";
import { useResizableColumns } from "@/components/ui/DataTable";
import { formatDate } from "@/lib/date";
import Link from "next/link";

import type { VendorDetail } from "../../types/vendor.type";
import VendorDocumentUpload from "./VendorDocumentUpload";

const DOCUMENT_COLUMNS = [
  { key: "type", label: "서류 유형", defaultWidth: 180, minWidth: 110 },
  { key: "file", label: "파일명", defaultWidth: 320, minWidth: 160 },
  { key: "open", label: "열기", defaultWidth: 100, minWidth: 80 },
];
const PURCHASE_COLUMNS = [
  { key: "date", label: "발주일", defaultWidth: 120, minWidth: 100 },
  { key: "number", label: "발주번호", defaultWidth: 140, minWidth: 100 },
  { key: "name", label: "품명", defaultWidth: 220, minWidth: 130 },
  { key: "quantity", label: "수량", defaultWidth: 90, minWidth: 70 },
  { key: "unitPrice", label: "단가", defaultWidth: 120, minWidth: 90 },
  { key: "total", label: "총액", defaultWidth: 130, minWidth: 100 },
  { key: "status", label: "상태", defaultWidth: 100, minWidth: 80 },
  { key: "memo", label: "비고", defaultWidth: 180, minWidth: 110 },
];

export default function VendorDetailView({ vendor }: { vendor: VendorDetail }) {
  const documentTable = useResizableColumns("vendor-detail-documents", DOCUMENT_COLUMNS);
  const purchaseTable = useResizableColumns("vendor-detail-purchases", PURCHASE_COLUMNS);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">거래처 기본정보</h2>
          <Link
            href={`/purchase/vendors/${vendor.id}/edit`}
            className="flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            정보 수정
          </Link>
        </div>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="거래처명" value={vendor.name} />
          <DetailItem label="담당자" value={vendor.manager} />
          <DetailItem label="연락처" value={vendor.phone} />
          <DetailItem label="이메일" value={vendor.email} />
          <DetailItem label="취급품목" value={vendor.handledItems} />
          <DetailItem label="비고" value={vendor.memo} />
        </dl>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">거래처 제출서류</h2>
            <p className="text-sm text-gray-500">총 {vendor.documents.length}건</p>
          </div>
          <VendorDocumentUpload vendorId={vendor.id} />
        </div>

        {vendor.documents.length === 0 ? (
          <EmptyState message="등록된 서류가 없습니다." />
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            {documentTable.hasCustomWidths ? <ResetWidths onClick={documentTable.resetAll} /> : null}
            <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm" style={{ minWidth: 600 }}>
              <colgroup>{DOCUMENT_COLUMNS.map((column) => <col key={column.key} style={documentTable.getColumnStyle(column.key)} />)}</colgroup>
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  {DOCUMENT_COLUMNS.map((column) => <th key={column.key} className={`relative p-3 ${column.key === "open" ? "text-center" : ""}`}>{column.label}{documentTable.renderResizeHandle(column.key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {vendor.documents.flatMap((document) =>
                  document.attachments.length > 0
                    ? document.attachments.map((attachment) => (
                        <tr key={`${document.id}-${attachment.id}`} className="border-t border-gray-100">
                          <td className="p-3">{document.type || "-"}</td>
                          <td className="p-3">{attachment.filename}</td>
                          <td className="p-3 text-center">
                            <a href={attachment.url} target="_blank" rel="noreferrer" className="font-medium text-[var(--brand-secondary)] hover:underline">열기</a>
                          </td>
                        </tr>
                      ))
                    : [
                        <tr key={document.id} className="border-t border-gray-100">
                          <td className="p-3">{document.type || "-"}</td>
                          <td className="p-3 text-gray-500">첨부파일 없음</td>
                          <td className="p-3 text-center">-</td>
                        </tr>,
                      ]
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">구매 아이템 내역</h2>
          <p className="text-sm text-gray-500">총 {vendor.purchaseItems.length}건</p>
        </div>

        {vendor.purchaseItems.length === 0 ? (
          <EmptyState message="구매 아이템 내역이 없습니다." />
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            {purchaseTable.hasCustomWidths ? <ResetWidths onClick={purchaseTable.resetAll} /> : null}
            <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm" style={{ minWidth: 1080 }}>
              <colgroup>{PURCHASE_COLUMNS.map((column) => <col key={column.key} style={purchaseTable.getColumnStyle(column.key)} />)}</colgroup>
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  {PURCHASE_COLUMNS.map((column) => <th key={column.key} className={`relative p-3 ${["quantity", "unitPrice", "total"].includes(column.key) ? "text-right" : column.key === "status" ? "text-center" : ""}`}>{column.label}{purchaseTable.renderResizeHandle(column.key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {vendor.purchaseItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="whitespace-nowrap p-3">
                      {item.orderDate ? formatDate(item.orderDate) : "-"}
                    </td>
                    <td className="whitespace-nowrap p-3">{item.orderNumber || "-"}</td>
                    <td className="p-3 font-medium text-gray-900">{item.name || "-"}</td>
                    <td className="p-3 text-right">{item.quantity.toLocaleString()}</td>
                    <td className="p-3 text-right">{formatAmount(item.unitPrice)}</td>
                    <td className="p-3 text-right font-medium">{formatAmount(item.totalAmount)}</td>
                    <td className="p-3 text-center">{item.status || "-"}</td>
                    <td className="p-3">{item.memo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ResetWidths({ onClick }: { onClick: () => void }) {
  return <div className="flex justify-end border-b border-gray-100 px-3 py-2"><button type="button" onClick={onClick} className="text-xs text-gray-500 hover:text-gray-900">컬럼 너비 초기화</button></div>;
}

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || "-"}</dd>
    </div>
  );
}
