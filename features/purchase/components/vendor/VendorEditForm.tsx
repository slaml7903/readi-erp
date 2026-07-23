"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, ConfirmDialog } from "@/components/ui";

import type { CreateVendorInput } from "../../types/vendor.type";
import VendorFieldsForm from "./VendorFieldsForm";

export default function VendorEditForm({
  vendorId,
  initialValue,
}: {
  vendorId: string;
  initialValue: CreateVendorInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const updateField = (field: keyof CreateVendorInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateVendor = async (allowDuplicateName = false) => {
    const response = await fetch(`/api/purchase/vendors/${vendorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, allowDuplicateName }),
    });
    const result = await response.json();

    if (response.status === 409 && result.code === "DUPLICATE_VENDOR_NAME") {
      setDuplicateWarning(result.message);
      return false;
    }

    if (!response.ok) {
      throw new Error(result.message ?? "거래처 정보 수정에 실패했습니다.");
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);
      const updated = await updateVendor();

      if (updated) {
        router.push(`/purchase/vendors/${vendorId}?updated=1`);
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "거래처 정보 수정에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
      <Card className="space-y-5 p-6">
        <VendorFieldsForm value={form} onChange={updateField} disabled={isSubmitting} />

        {errorMessage ? (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/purchase/vendors/${vendorId}`)}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" loading={isSubmitting}>저장</Button>
      </div>
      <ConfirmDialog open={Boolean(duplicateWarning)} title="동일한 거래처명 확인" description={duplicateWarning} confirmLabel="계속 저장" loading={isSubmitting} onClose={() => setDuplicateWarning("")} onConfirm={async () => { try { setIsSubmitting(true); const updated = await updateVendor(true); if (updated) { router.push(`/purchase/vendors/${vendorId}?updated=1`); router.refresh(); } } catch (error) { setDuplicateWarning(""); setErrorMessage(error instanceof Error ? error.message : "거래처 정보 수정에 실패했습니다."); } finally { setIsSubmitting(false); } }} />
    </form>
  );
}
