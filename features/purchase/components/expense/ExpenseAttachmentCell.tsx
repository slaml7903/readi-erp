"use client";

import { AttachmentCell } from "@/components/ui";
import type { AirtableAttachment } from "../../types/purchase.type";

export default function ExpenseAttachmentCell({ files, documentType }: { files: AirtableAttachment[]; documentType: string }) {
  return <AttachmentCell files={files} label={documentType} />;
}
