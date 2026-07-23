import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui";
import ExpenseDetailView from "@/features/purchase/components/expense/ExpenseDetailView";
import { PurchaseValidationError } from "@/features/purchase/errors/purchase-validation.error";
import { fetchExpenseDetail } from "@/features/purchase/services/expense.service";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function ExpenseDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  let expense;

  try {
    expense = await fetchExpenseDetail(orderId);
  } catch (error) {
    if (error instanceof PurchaseValidationError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={expense.orderNumber || "지출 상세"} description="발주 품목과 지출 증빙을 확인합니다." />
        <Link href="/purchase/expenses" className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">목록으로</Link>
      </div>
      <ExpenseDetailView expense={expense} />
    </div>
  );
}
