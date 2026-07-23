import { PageHeader } from "@/components/ui";
import ExpenseListClient from "@/features/purchase/components/expense/ExpenseListClient";
import {
  fetchExpenses,
  parseExpenseFilters,
} from "@/features/purchase/services/expense.service";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpensesPage({ searchParams }: PageProps) {
  const filters = parseExpenseFilters(await searchParams);
  const result = await fetchExpenses(filters);

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="지출관리"
        description="지출 대상 발주와 증빙을 확인하고 지출완료 상태를 관리합니다."
      />
      <ExpenseListClient result={result} filters={filters} />
    </div>
  );
}
