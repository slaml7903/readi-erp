import { PageHeader } from "@/components/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import VendorListClient from "@/features/purchase/components/vendor/VendorListClient";
import { fetchVendorsForManagement } from "@/features/purchase/services/vendor.service";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function VendorsPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const vendors = await fetchVendorsForManagement(q);

  return (
    <div className="space-y-6 text-gray-900">
      <PageHeader title="거래처 관리" description="구매 거래처와 제출서류를 조회하고 등록합니다." actions={<Link href="/purchase/vendors/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"><Plus aria-hidden="true" size={16} />신규 거래처 등록</Link>} />
      <VendorListClient vendors={vendors} initialSearch={q} />
    </div>
  );
}
