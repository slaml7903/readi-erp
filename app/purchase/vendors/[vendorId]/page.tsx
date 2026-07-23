import Link from "next/link";

import { PageHeader } from "@/components/ui";
import VendorDetailView from "@/features/purchase/components/vendor/VendorDetailView";
import { fetchVendorDetail } from "@/features/purchase/services/vendor.service";

type PageProps = {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ updated?: string }>;
};

export default async function VendorDetailPage({ params, searchParams }: PageProps) {
  const { vendorId } = await params;
  const { updated } = await searchParams;
  const vendor = await fetchVendorDetail(vendorId);

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={vendor.name} description={`Airtable Record ID: ${vendor.id}`} />
        <Link href="/purchase/vendors" className="flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
          목록으로
        </Link>
      </div>
      {updated === "1" ? (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          거래처 정보가 저장되었습니다.
        </p>
      ) : null}
      <VendorDetailView vendor={vendor} />
    </div>
  );
}
