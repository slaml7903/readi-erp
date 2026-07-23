"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Card, Select } from "@/components/ui";
import { FileDropzone } from "@/components/ui/FileDropzone";
import {
  DOCUMENT_TYPES,
  VENDOR_DOCUMENT_FILE_TYPES,
} from "../../config/vendor.config";

export default function VendorDocumentUpload({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!documentType || !file) {
      setErrorMessage("서류 유형과 파일을 모두 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.set("documentType", documentType);
    formData.set("file", file);

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/purchase/vendors/${vendorId}/documents`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message ?? "서류 업로드에 실패했습니다.");

      setDocumentType("");
      setFile(null);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "서류 업로드에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return <Button type="button" onClick={() => setIsOpen(true)}>서류 업로드</Button>;
  }

  return (
    <Card className="mt-4 border-gray-300 p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-w-sm">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">서류 유형</label>
          <Select value={documentType} onChange={(event) => setDocumentType(event.target.value)} disabled={isSubmitting} className="w-full">
            <option value="">선택</option>
            {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
        </div>

        <FileDropzone
          label="파일"
          required
          file={file}
          onFileChange={setFile}
          accept={VENDOR_DOCUMENT_FILE_TYPES}
          disabled={isSubmitting}
          helperText="PDF, JPG, PNG, WEBP / 최대 10MB"
        />

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>취소</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "업로드 중..." : "업로드"}</Button>
        </div>
      </form>
    </Card>
  );
}
