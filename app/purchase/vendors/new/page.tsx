import { PageHeader } from "@/components/ui";
import VendorCreateForm from "@/features/purchase/components/vendor/VendorCreateForm";

export default function NewVendorPage() {
  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader title="신규 거래처 등록" description="Airtable 구매 베이스에 거래처 기본정보를 등록합니다." />
      <VendorCreateForm />
    </div>
  );
}
