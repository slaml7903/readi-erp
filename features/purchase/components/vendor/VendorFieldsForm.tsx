"use client";

import { Input } from "@/components/ui";

import type { CreateVendorInput } from "../../types/vendor.type";

export default function VendorFieldsForm({
  value,
  onChange,
  disabled = false,
}: {
  value: CreateVendorInput;
  onChange: (field: keyof CreateVendorInput, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="거래처명" required>
        <Input
          value={value.name}
          onChange={(event) => onChange("name", event.target.value)}
          maxLength={100}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
      <FormField label="담당자">
        <Input
          value={value.manager ?? ""}
          onChange={(event) => onChange("manager", event.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
      <FormField label="연락처">
        <Input
          type="tel"
          value={value.phone ?? ""}
          onChange={(event) => onChange("phone", event.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
      <FormField label="이메일">
        <Input
          type="email"
          value={value.email ?? ""}
          onChange={(event) => onChange("email", event.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
      <FormField label="취급품목">
        <Input
          value={value.handledItems ?? ""}
          onChange={(event) => onChange("handledItems", event.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
      <FormField label="비고">
        <Input
          value={value.memo ?? ""}
          onChange={(event) => onChange("memo", event.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </FormField>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
