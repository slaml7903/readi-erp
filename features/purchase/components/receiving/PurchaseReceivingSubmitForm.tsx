"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button, Card, Input } from "@/components/ui";
import { FileDropzone } from "@/components/ui/FileDropzone";

import type { PurchaseReceivingOrderDetail } from "../../types/purchase.type";

type PurchaseReceivingSubmitFormProps = {
  order: PurchaseReceivingOrderDetail;
};

const documentFileAccept = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function fileToAirtableUpload(file: File) {
  return new Promise<{
    filename: string;
    contentType: string;
    file: string;
  }>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("파일을 읽을 수 없습니다."));
        return;
      }

      const [, base64File = ""] = result.split(",");

      resolve({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        file: base64File,
      });
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

export default function PurchaseReceivingSubmitForm({
  order,
}: PurchaseReceivingSubmitFormProps) {
  const router = useRouter();

  const [receivingChecker, setReceivingChecker] = useState(
    order.receivingChecker ?? ""
  );
  const [receivingDate, setReceivingDate] = useState("");
  const [memo, setMemo] = useState("");
  const [transactionStatementFile, setTransactionStatementFile] =
    useState<File | null>(null);
  const [receivingEvidenceFile, setReceivingEvidenceFile] =
    useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!receivingChecker.trim()) {
      alert("입고확인자를 입력해주세요.");
      return false;
    }

    if (!receivingDate) {
      alert("입고확인일을 입력해주세요.");
      return false;
    }

    if (!transactionStatementFile) {
      alert("거래명세서를 첨부해주세요.");
      return false;
    }

    if (!receivingEvidenceFile) {
      alert("입고증빙을 첨부해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/purchase/receiving", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderRecordId: order.id,
          receivingChecker: receivingChecker.trim(),
          receivingDate,
          memo: memo.trim() || undefined,
          transactionStatementFile: transactionStatementFile
            ? await fileToAirtableUpload(transactionStatementFile)
            : undefined,
          receivingEvidenceFile: receivingEvidenceFile
            ? await fileToAirtableUpload(receivingEvidenceFile)
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message ?? "입고확인 제출에 실패했습니다.");
        return;
      }

      alert("입고확인이 제출되었습니다. 검토 전까지 발주 상태는 변경되지 않습니다.");
      router.replace("/purchase/receiving/review");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("입고확인 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-12 gap-3 text-sm">
          <InfoItem label="발주번호" value={order.poNo || "-"} />
          <InfoItem label="제목" value={order.title || "-"} wide />
          <InfoItem
            label="거래처/벤더"
            value={order.vendorNames?.join(", ") || "-"}
            wide
          />
          <InfoItem label="예상 입고일" value={order.expectedReceivingDate || "-"} />
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-100 text-xs text-gray-600">
              <tr>
                <th className="w-12 px-3 py-2 text-center">No.</th>
                <th className="px-3 py-2 text-left">발주상세 모델명</th>
                <th className="w-24 px-3 py-2 text-right">수량</th>
                <th className="w-32 px-3 py-2 text-right">단가</th>
                <th className="w-32 px-3 py-2 text-right">총액</th>
                <th className="w-56 px-3 py-2 text-left">비고</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    발주상세품목이 없습니다.
                  </td>
                </tr>
              ) : (
                order.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-center text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">{item.modelName || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {item.quantity?.toLocaleString() ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.unitPrice?.toLocaleString() ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.amount?.toLocaleString() ?? "-"}
                    </td>
                    <td className="px-3 py-2">{item.memo || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3">
            <label className="col-span-4 block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                입고확인자 <span className="text-red-500">*</span>
              </span>
              <Input
                value={receivingChecker}
                onChange={(event) => setReceivingChecker(event.target.value)}
                className="h-9"
              />
            </label>

            <label className="col-span-4 block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                입고확인일 <span className="text-red-500">*</span>
              </span>
              <Input
                type="date"
                value={receivingDate}
                onChange={(event) => setReceivingDate(event.target.value)}
                className="h-9"
              />
            </label>

            <label className="col-span-4 block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                비고
              </span>
              <Input
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                className="h-9"
              />
            </label>

            <div className="col-span-6">
              <FileDropzone
                label="거래명세서"
                required
                file={transactionStatementFile}
                onFileChange={setTransactionStatementFile}
                accept={documentFileAccept}
              />
            </div>

            <div className="col-span-6">
              <FileDropzone
                label="입고증빙"
                required
                file={receivingEvidenceFile}
                onFileChange={setReceivingEvidenceFile}
                accept={documentFileAccept}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.push("/purchase/receiving")}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "제출 중..." : "입고확인 제출"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function InfoItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-4" : "col-span-2"}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
    </div>
  );
}
