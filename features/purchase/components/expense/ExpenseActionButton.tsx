"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, ConfirmDialog } from "@/components/ui";

type Props = {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  itemSummary: string;
  amount: number;
  expenseCompleted: boolean;
  missingDocumentLabels: string[];
};

export default function ExpenseActionButton(props: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openDialog = () => {
    setErrorMessage("");
    setIsOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setErrorMessage("");
  };

  const handleChange = async () => {
    if (isSubmitting) return;
    const nextCompleted = !props.expenseCompleted;

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const response = await fetch(`/api/purchase/expenses/${props.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseCompleted: nextCompleted }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "지출 상태 변경에 실패했습니다.");
      }

      setIsOpen(false);
      window.alert(
        nextCompleted
          ? "지출완료로 처리했습니다."
          : "지출대기 상태로 변경했습니다."
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "지출 상태 변경에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCompleted = !props.expenseCompleted;

  return (
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <Button
        type="button"
        variant={props.expenseCompleted ? "outline" : "primary"}
        onClick={openDialog}
        disabled={isSubmitting}
        className="h-8 whitespace-nowrap px-2.5 text-xs"
      >
        {props.expenseCompleted ? "완료 취소" : "지출완료"}
      </Button>

      <ConfirmDialog
        open={isOpen}
        title={nextCompleted ? "지출완료 확인" : "완료 취소 확인"}
        description={nextCompleted ? "이 발주 건을 지출완료로 처리할까요?" : "이 발주 건을 다시 지출대기 상태로 변경할까요?"}
        confirmLabel={nextCompleted ? "지출완료 확인" : "완료 취소 확인"}
        loading={isSubmitting}
        danger={!nextCompleted}
        error={errorMessage}
        onConfirm={handleChange}
        onClose={closeDialog}
      >
            <dl className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <dt className="text-gray-500">발주번호</dt>
              <dd className="font-medium text-gray-900">{props.orderNumber || "-"}</dd>
              <dt className="text-gray-500">거래처</dt>
              <dd className="font-medium text-gray-900">{props.vendorName || "-"}</dd>
              <dt className="text-gray-500">품명</dt>
              <dd className="font-medium text-gray-900">{props.itemSummary || "-"}</dd>
              <dt className="text-gray-500">지출금액</dt>
              <dd className="font-semibold text-gray-900">
                {props.amount.toLocaleString("ko-KR")}원
              </dd>
            </dl>

            {nextCompleted && props.missingDocumentLabels.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>누락 서류:</strong> {props.missingDocumentLabels.join(", ")}
                <p className="mt-1">누락 내용을 확인한 후 처리해주세요.</p>
              </div>
            ) : null}

            {nextCompleted ? (
              <p className="mt-4 text-sm font-medium text-red-700">
                실제 송금이 완료된 경우에만 확인을 눌러주세요.
              </p>
            ) : null}

      </ConfirmDialog>
    </div>
  );
}
