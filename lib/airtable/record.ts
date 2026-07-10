import type { AirtableRecord } from "./client";

export type AirtableRawRecord = AirtableRecord;

export type AirtableAttachmentRaw = {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
};

export function toAirtableString(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).join(", ");
  }

  return String(value).trim();
}

export function toAirtableFirstString(value: unknown): string {
  if (Array.isArray(value)) return value[0] ? String(value[0]).trim() : "";
  return toAirtableString(value);
}

export function toAirtableStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : undefined;
}

export function toAirtableLinkedRecordIds(value: unknown): string[] {
  return toAirtableStringArray(value) ?? [];
}

export function toAirtableNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (Array.isArray(value)) {
    return toAirtableNumber(value[0]);
  }

  return 0;
}

export function toAirtableBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

export function toAirtableDateOnly(value: unknown): string {
  const text = toAirtableString(value);
  if (!text) return "";
  return text.slice(0, 10);
}

export function toAirtableAttachments<TAttachment>(
  value: unknown,
  mapper: (raw: AirtableAttachmentRaw) => TAttachment
): TAttachment[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const files = value
    .map((item) => item as Partial<AirtableAttachmentRaw>)
    .filter((item) => item.id && item.url && item.filename)
    .map((item) =>
      mapper({
        id: String(item.id),
        url: String(item.url),
        filename: String(item.filename),
        size: item.size,
        type: item.type,
      })
    );

  return files.length > 0 ? files : undefined;
}

export function removeEmptyFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim().length === 0) return false;
      return true;
    })
  );
}

export function removeUndefinedFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}
