"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, ConfirmDialog } from "@/components/ui";
import type { CreateVendorInput } from "../../types/vendor.type";
import VendorFieldsForm from "./VendorFieldsForm";

const INITIAL_FORM: CreateVendorInput = {
  name: "",
  manager: "",
  email: "",
  phone: "",
  handledItems: "",
  memo: "",
};

export default function VendorCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const updateField = (field: keyof CreateVendorInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createVendor = async (allowDuplicateName = false) => {
    const response = await fetch("/api/purchase/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, allowDuplicateName }),
    });
    const result = await response.json();

    if (response.status === 409 && result.code === "DUPLICATE_VENDOR_NAME") {
      setDuplicateWarning(result.message);
      return undefined;
    }

    if (!response.ok) {
      throw new Error(result.message ?? "거래처 등록에 실패했습니다.");
    }

    return result.vendor as { id: string };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);
      const vendor = await createVendor();
      if (vendor) router.push(`/purchase/vendors/${vendor.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "거래처 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
      <Card className="space-y-5 p-6">
        <VendorFieldsForm value={form} onChange={updateField} disabled={isSubmitting} />

        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          현재 Airtable에는 사업자등록번호 필드가 없어 거래처명 중복만 경고합니다.
        </p>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/purchase/vendors")} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" loading={isSubmitting}>등록</Button>
      </div>
      <ConfirmDialog open={Boolean(duplicateWarning)} title="동일한 거래처명 확인" description={duplicateWarning} confirmLabel="계속 등록" loading={isSubmitting} onClose={() => setDuplicateWarning("")} onConfirm={async () => { try { setIsSubmitting(true); const vendor = await createVendor(true); if (vendor) router.push(`/purchase/vendors/${vendor.id}`); } catch (error) { setDuplicateWarning(""); setErrorMessage(error instanceof Error ? error.message : "거래처 등록에 실패했습니다."); } finally { setIsSubmitting(false); } }} />
    </form>
  );
}
