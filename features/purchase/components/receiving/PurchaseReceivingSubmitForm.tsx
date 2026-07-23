"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button, Card, Input } from "@/components/ui";
import { MultiFileDropzone } from "@/components/ui/FileDropzone";

import { PURCHASE_ORDER_STATUS } from "../../constants/purchase-status";
import type {
  CreateAirtableAttachmentInput,
  PurchaseReceivingOrderOption,
  PurchaseReceivingRequestOption,
  PurchaseReceivingSelectionData,
} from "../../types/purchase.type";

const documentFileAccept = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function todayInKorea() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeSearch(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

function fileToAirtableUpload(file: File) {
  return new Promise<CreateAirtableAttachmentInput>((resolve, reject) => {
    if (file.size === 0) {
      reject(new Error(`'${file.name}' 파일이 비어 있습니다.`));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error(`'${file.name}' 파일은 5MB를 초과할 수 없습니다.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`'${file.name}' 파일을 읽을 수 없습니다.`));
        return;
      }
      const [, base64File = ""] = reader.result.split(",");
      resolve({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        file: base64File,
      });
    };
    reader.onerror = () => reject(new Error(`'${file.name}' 파일을 읽는 중 오류가 발생했습니다.`));
    reader.readAsDataURL(file);
  });
}

export default function PurchaseReceivingSubmitForm({
  data,
}: {
  data: PurchaseReceivingSelectionData;
}) {
  const router = useRouter();
  const [requestSearch, setRequestSearch] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [receivingChecker, setReceivingChecker] = useState("");
  const [receivingDate, setReceivingDate] = useState(todayInKorea);
  const [memo, setMemo] = useState("");
  const [transactionStatementFiles, setTransactionStatementFiles] = useState<File[]>([]);
  const [receivingEvidenceFiles, setReceivingEvidenceFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; no?: string }>();

  const selectedRequest = data.requests.find((request) => request.id === selectedRequestId);
  const selectedOrder = data.orders.find((order) => order.id === selectedOrderId);

  const requestOptions = useMemo(() => {
    const keywords = normalizeSearch(requestSearch).split(" ").filter(Boolean);
    return data.requests.filter((request) => {
      const searchable = normalizeSearch(`${request.prNo} ${request.title ?? ""}`);
      return keywords.every((keyword) => searchable.includes(keyword));
    }).slice(0, 30);
  }, [data.requests, requestSearch]);

  const orderOptions = useMemo(() => {
    if (!selectedRequest) return [];
    const keyword = normalizeSearch(orderSearch);
    return data.orders.filter(
      (order) =>
        selectedRequest.orderRecordIds.includes(order.id) &&
        order.requestRecordIds.includes(selectedRequest.id) &&
        order.status !== PURCHASE_ORDER_STATUS.CANCELLED &&
        order.status !== PURCHASE_ORDER_STATUS.RECEIVED &&
        normalizeSearch(order.poNo).includes(keyword)
    );
  }, [data.orders, orderSearch, selectedRequest]);

  const orderItems = useMemo(() => {
    if (!selectedOrder) return [];
    return data.items.filter(
      (item) =>
        selectedOrder.orderItemRecordIds.includes(item.id) &&
        item.orderRecordIds.includes(selectedOrder.id)
    );
  }, [data.items, selectedOrder]);
  const selectableItems = orderItems.filter((item) => item.selectable);

  function selectRequest(request: PurchaseReceivingRequestOption) {
    setSelectedRequestId(request.id);
    setRequestSearch("");
    setSelectedOrderId("");
    setOrderSearch("");
    setSelectedItemIds([]);
    setError("");
  }

  function clearRequest() {
    setSelectedRequestId("");
    setSelectedOrderId("");
    setOrderSearch("");
    setSelectedItemIds([]);
    setError("");
  }

  function selectOrder(order: PurchaseReceivingOrderOption) {
    setSelectedOrderId(order.id);
    setOrderSearch("");
    setSelectedItemIds([]);
    setError("");
  }

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  function resetForm() {
    setSelectedRequestId("");
    setRequestSearch("");
    setSelectedOrderId("");
    setOrderSearch("");
    setSelectedItemIds([]);
    setReceivingChecker("");
    setReceivingDate(todayInKorea());
    setMemo("");
    setTransactionStatementFiles([]);
    setReceivingEvidenceFiles([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSuccess(undefined);

    if (!selectedRequest || !selectedOrder || selectedItemIds.length === 0) {
      setError("구매요청, 발주번호, 입고 품목을 모두 선택해 주세요.");
      return;
    }
    if (!receivingChecker.trim() || !receivingDate) {
      setError("입고확인자와 입고확인일을 입력해 주세요.");
      return;
    }
    if (transactionStatementFiles.length === 0 || receivingEvidenceFiles.length === 0) {
      setError("거래명세서와 입고증빙을 하나 이상 첨부해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const [transactionUploads, evidenceUploads] = await Promise.all([
        Promise.all(transactionStatementFiles.map(fileToAirtableUpload)),
        Promise.all(receivingEvidenceFiles.map(fileToAirtableUpload)),
      ]);
      const response = await fetch("/api/purchase/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestRecordId: selectedRequest.id,
          orderRecordId: selectedOrder.id,
          orderItemRecordIds: selectedItemIds,
          receivingChecker: receivingChecker.trim(),
          receivingDate,
          memo: memo.trim() || undefined,
          transactionStatementFiles: transactionUploads,
          receivingEvidenceFiles: evidenceUploads,
        }),
      });
      const result = (await response.json()) as {
        receivingId?: string;
        receivingNo?: string;
        message?: string;
      };
      if (!response.ok || !result.receivingId) {
        throw new Error(result.message || "입고확인 요청을 등록하지 못했습니다.");
      }

      setSuccess({ id: result.receivingId, no: result.receivingNo });
      resetForm();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "입고확인 요청을 등록하지 못했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      {success ? (
        <Card className="border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">입고확인 요청이 등록되었습니다.</p>
          <p className="mt-1 text-sm text-green-700">
            {success.no ? `입고확인번호 ${success.no} · ` : ""}RCV ID {success.id}
          </p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => router.push("/purchase/receiving")}>
            입고확인 목록 보기
          </Button>
        </Card>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <StepCard number="1" title="구매요청번호 선택">
        {selectedRequest ? (
          <SelectedValue
            title={selectedRequest.prNo}
            description={selectedRequest.title || "제목 없음"}
            disabled={isSubmitting}
            onChange={clearRequest}
          />
        ) : (
          <SearchOptions
            value={requestSearch}
            placeholder="구매요청번호 또는 제목 검색"
            onChange={setRequestSearch}
            emptyMessage="연결된 발주가 있는 구매요청이 없습니다."
          >
            {requestOptions.map((request) => (
              <OptionButton
                key={request.id}
                title={request.prNo}
                description={request.title || "제목 없음"}
                onClick={() => selectRequest(request)}
              />
            ))}
          </SearchOptions>
        )}
      </StepCard>

      <StepCard number="2" title="발주번호 선택" disabled={!selectedRequest}>
        {selectedOrder ? (
          <SelectedValue
            title={selectedOrder.poNo}
            description={selectedOrder.status || "상태 미확인"}
            disabled={isSubmitting}
            onChange={() => {
              setSelectedOrderId("");
              setSelectedItemIds([]);
            }}
          />
        ) : selectedRequest ? (
          <SearchOptions
            value={orderSearch}
            placeholder="발주번호 검색"
            onChange={setOrderSearch}
            emptyMessage="입고 가능한 발주가 없습니다."
          >
            {orderOptions.map((order) => (
              <OptionButton
                key={order.id}
                title={order.poNo}
                description={order.status || "상태 미확인"}
                onClick={() => selectOrder(order)}
              />
            ))}
          </SearchOptions>
        ) : null}
      </StepCard>

      <StepCard number="3" title="입고아이템 선택" disabled={!selectedOrder}>
        {selectedOrder ? (
          selectableItems.length === 0 ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              입고 처리 가능한 품목이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="w-14 p-3 text-center">선택</th>
                    <th className="p-3 text-left">품명</th>
                    <th className="p-3 text-left">품목코드 / Item master</th>
                    <th className="p-3 text-left">규격</th>
                    <th className="p-3 text-right">발주수량</th>
                    <th className="p-3 text-center">현재 상태</th>
                    <th className="p-3 text-center">환불/취소</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className={item.selectable ? "border-t border-gray-100" : "border-t border-gray-100 bg-gray-50 text-gray-400"}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          disabled={!item.selectable || isSubmitting}
                          onChange={() => toggleItem(item.id)}
                          aria-label={`${item.itemName} 선택`}
                        />
                      </td>
                      <td className="p-3 font-medium">{item.itemName}</td>
                      <td className="p-3">{item.itemMaster}</td>
                      <td className="p-3">{item.specification || "-"}</td>
                      <td className="p-3 text-right">{item.quantity?.toLocaleString("ko-KR") ?? "-"}</td>
                      <td className="p-3 text-center" title={item.unavailableReason}>{item.status}</td>
                      <td className="p-3 text-center">{item.refundOrCancelled ? "대상" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </StepCard>

      <StepCard number="4" title="입고정보 및 증빙" disabled={selectedItemIds.length === 0}>
        {selectedItemIds.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>입고확인자 *</span>
                <Input value={receivingChecker} disabled={isSubmitting} onChange={(event) => setReceivingChecker(event.target.value)} className="w-full" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>입고확인일 *</span>
                <Input type="date" value={receivingDate} disabled={isSubmitting} onChange={(event) => setReceivingDate(event.target.value)} className="w-full" />
              </label>
            </div>
            <label className="block space-y-1 text-sm font-medium text-gray-700">
              <span>비고</span>
              <textarea
                value={memo}
                disabled={isSubmitting}
                onChange={(event) => setMemo(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </label>
            <div className="grid gap-4 lg:grid-cols-2">
              <MultiFileDropzone label="거래명세서" required files={transactionStatementFiles} onFilesChange={setTransactionStatementFiles} accept={documentFileAccept} disabled={isSubmitting} />
              <MultiFileDropzone label="입고증빙사진" required files={receivingEvidenceFiles} onFilesChange={setReceivingEvidenceFiles} accept={documentFileAccept} disabled={isSubmitting} />
            </div>
          </div>
        ) : null}
      </StepCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={resetForm}>초기화</Button>
        <Button type="submit" disabled={isSubmitting || selectedItemIds.length === 0}>
          {isSubmitting ? "등록 중..." : "입고확인 요청 등록"}
        </Button>
      </div>
    </form>
  );
}

function StepCard({
  number,
  title,
  disabled = false,
  children,
}: {
  number: string;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={`p-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-white">{number}</span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function SearchOptions({
  value,
  placeholder,
  onChange,
  emptyMessage,
  children,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const hasOptions = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="space-y-2">
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full" />
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
        {hasOptions ? children : <p className="p-4 text-center text-sm text-gray-500">{emptyMessage}</p>}
      </div>
    </div>
  );
}

function OptionButton({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50">
      <span className="block text-sm font-medium text-gray-900">{title}</span>
      <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
    </button>
  );
}

function SelectedValue({ title, description, disabled, onChange }: { title: string; description: string; disabled: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="mt-0.5 text-sm text-gray-600">{description}</p>
      </div>
      <Button type="button" variant="outline" disabled={disabled} onClick={onChange}>변경</Button>
    </div>
  );
}
