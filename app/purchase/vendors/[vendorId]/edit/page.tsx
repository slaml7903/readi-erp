import { PageHeader } from "@/components/ui";
import VendorEditForm from "@/features/purchase/components/vendor/VendorEditForm";
import { fetchVendorForEdit } from "@/features/purchase/services/vendor.service";

type PageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function VendorEditPage({ params }: PageProps) {
  const { vendorId } = await params;
  const vendor = await fetchVendorForEdit(vendorId);

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader
        title="거래처 정보 수정"
        description={`${vendor.name}의 기본정보를 수정합니다.`}
      />
      <VendorEditForm
        vendorId={vendor.id}
        initialValue={{
          name: vendor.name,
          manager: vendor.manager ?? "",
          email: vendor.email ?? "",
          phone: vendor.phone ?? "",
          handledItems: vendor.handledItems ?? "",
          memo: vendor.memo ?? "",
        }}
      />
    </div>
  );
}
