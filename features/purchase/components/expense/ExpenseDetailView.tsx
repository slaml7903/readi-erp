"use client";

import { Card } from "@/components/ui";
import { useResizableColumns } from "@/components/ui/DataTable";
import { formatDate } from "@/lib/date";

import type { ExpenseListItem } from "../../types/expense.type";
import ExpenseActionButton from "./ExpenseActionButton";
import ExpenseDocumentPreview from "./ExpenseDocumentPreview";

const ITEM_COLUMNS = [
  { key: "name", label: "품명", defaultWidth: 230, minWidth: 130 },
  { key: "quantity", label: "수량", defaultWidth: 90, minWidth: 70 },
  { key: "unitPrice", label: "단가", defaultWidth: 120, minWidth: 90 },
  { key: "total", label: "총액", defaultWidth: 130, minWidth: 100 },
  { key: "vat", label: "VAT", defaultWidth: 80, minWidth: 65 },
  { key: "status", label: "상태", defaultWidth: 90, minWidth: 75 },
  { key: "memo", label: "비고", defaultWidth: 180, minWidth: 110 },
];

export default function ExpenseDetailView({ expense }: { expense: ExpenseListItem }) {
  const itemTable = useResizableColumns("expense-detail-items", ITEM_COLUMNS);
  const documents = [
    { label: "기안서", files: expense.approvalFiles },
    { label: "구매요청서", files: expense.requestFormFiles },
    { label: "견적서", files: expense.quotationFiles },
    { label: "발주서", files: expense.purchaseOrderFiles },
    { label: "사업자등록증", files: expense.businessRegistrationFiles },
    { label: "통장사본", files: expense.bankbookFiles },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">기본정보</h2>
            <dl className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="구매요청번호" value={expense.requestNumbers.join(", ")} />
              <DetailItem label="발주번호" value={expense.orderNumber} />
              <DetailItem label="발주일" value={expense.orderDate ? formatDate(expense.orderDate) : undefined} />
              <DetailItem label="거래처" value={expense.vendorNames.join(", ")} />
              <DetailItem label="지출 상태" value={expense.expenseCompleted ? "지출완료" : "지출대기"} />
              <DetailItem label="총금액" value={`${expense.amount.toLocaleString("ko-KR")}원`} />
              <DetailItem label="VAT 포함 여부" value={expense.vatIncludedLabel} />
              <DetailItem label="비고" value={expense.memo} />
            </dl>
          </div>
          {expense.expenseCompleted && !expense.needExpense ? (
            <span className="rounded-full bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
              지출완료
            </span>
          ) : (
            <ExpenseActionButton
              orderId={expense.id}
              orderNumber={expense.orderNumber}
              vendorName={expense.vendorNames.join(", ")}
              itemSummary={expense.itemSummary}
              amount={expense.amount}
              expenseCompleted={expense.expenseCompleted}
              missingDocumentLabels={expense.missingDocumentLabels}
            />
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">전체 구매 품목</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          {itemTable.hasCustomWidths ? <div className="flex justify-end border-b border-gray-100 px-3 py-2"><button type="button" onClick={itemTable.resetAll} className="text-xs text-gray-500 hover:text-gray-900">컬럼 너비 초기화</button></div> : null}
          <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm" style={{ minWidth: 860 }}>
            <colgroup>{ITEM_COLUMNS.map((column) => <col key={column.key} style={itemTable.getColumnStyle(column.key)} />)}</colgroup>
            <thead className="bg-gray-100 text-left text-gray-700">
              <tr>
                {ITEM_COLUMNS.map((column) => <th key={column.key} className={`relative p-3 ${["quantity", "unitPrice", "total"].includes(column.key) ? "text-right" : ["vat", "status"].includes(column.key) ? "text-center" : ""}`}>{column.label}{itemTable.renderResizeHandle(column.key)}</th>)}
              </tr>
            </thead>
            <tbody>
              {expense.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-gray-900">{item.name || "-"}</td>
                  <td className="p-3 text-right">{item.quantity.toLocaleString("ko-KR")}</td>
                  <td className="p-3 text-right">{item.unitPrice.toLocaleString("ko-KR")}원</td>
                  <td className="p-3 text-right font-medium">{item.totalAmount.toLocaleString("ko-KR")}원</td>
                  <td className="p-3 text-center">{item.vatIncluded ? "포함" : "미포함"}</td>
                  <td className="p-3 text-center">{item.status || "-"}</td>
                  <td className="p-3">{item.memo || "-"}</td>
                </tr>
              ))}
              {expense.items.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">연결된 구매 품목이 없습니다.</td></tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">관련 서류</h2>
            <p className="mt-1 text-sm text-gray-500">파일을 선택할 때만 미리보기를 불러옵니다.</p>
          </div>
          {expense.missingDocumentLabels.length > 0 ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">누락 서류: {expense.missingDocumentLabels.join(", ")}</p>
          ) : null}
        </div>
        <ExpenseDocumentPreview documents={documents} />
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return <div><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value || "-"}</dd></div>;
}
