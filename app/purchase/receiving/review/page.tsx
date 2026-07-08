import { redirect } from "next/navigation";

type PurchaseReceivingReviewPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PurchaseReceivingReviewPage({
  searchParams,
}: PurchaseReceivingReviewPageProps) {
  const { q } = await searchParams;
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";

  redirect(`/purchase/receiving${suffix}`);
}
