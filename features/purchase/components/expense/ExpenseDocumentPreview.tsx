"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import type { AirtableAttachment } from "../../types/purchase.type";

type PreviewState = "idle" | "loading" | "ready" | "fallback";

export default function ExpenseDocumentPreview({
  documents,
}: {
  documents: Array<{ label: string; files: AirtableAttachment[] }>;
}) {
  const [selected, setSelected] = useState<AirtableAttachment>();
  const [state, setState] = useState<PreviewState>("idle");
  const supported = selected ? getPreviewKind(selected) : undefined;

  useEffect(() => {
    if (!selected || !supported || state !== "loading") return;
    const timeout = window.setTimeout(() => setState("fallback"), 2000);
    return () => window.clearTimeout(timeout);
  }, [selected, state, supported]);

  const startPreview = (file: AirtableAttachment) => {
    setSelected(file);
    setState(getPreviewKind(file) ? "loading" : "fallback");
  };

  const fileCount = documents.reduce((sum, document) => sum + document.files.length, 0);

  if (fileCount === 0) {
    return <p className="mt-4 text-sm text-gray-500">등록된 관련 서류가 없습니다.</p>;
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        {documents.map((document) => (
          <div key={document.label}>
            <h3 className="text-xs font-semibold text-gray-500">{document.label}</h3>
            {document.files.length === 0 ? (
              <p className="mt-1 text-sm text-gray-400">-</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {document.files.map((file) => (
                  <li key={file.id} className="rounded-md border border-gray-200 p-2">
                    <p title={file.filename} className="truncate text-sm text-gray-900">{file.filename}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {getPreviewKind(file) ? (
                        <button type="button" onClick={() => startPreview(file)} className="font-medium text-[var(--brand-secondary)] hover:underline">미리보기</button>
                      ) : null}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--brand-secondary)] hover:underline">새 탭에서 열기</a>
                      <a href={file.url} download={file.filename} rel="noopener noreferrer" className="font-medium text-gray-700 hover:underline">다운로드</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="min-h-72 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {!selected ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">미리볼 파일을 선택해주세요.</div>
        ) : state === "fallback" || !supported ? (
          <PreviewFallback file={selected} onRetry={supported ? () => setState("loading") : undefined} />
        ) : (
          <div className="relative min-h-64">
            {state === "loading" ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 text-sm text-gray-600">미리보기를 불러오는 중입니다...</div>
            ) : null}
            {supported === "image" ? (
              // Airtable attachment URLs are dynamic, so the native image element avoids a fixed host allow-list.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={`${selected.filename} 미리보기`} onLoad={() => setState("ready")} onError={() => setState("fallback")} className="mx-auto max-h-[680px] max-w-full object-contain" />
            ) : (
              <iframe src={selected.url} title={`${selected.filename} 미리보기`} onLoad={() => setState("ready")} className="h-[680px] w-full rounded bg-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewFallback({ file, onRetry }: { file: AirtableAttachment; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
      <div>
        <p className="font-medium text-gray-900">미리보기를 불러오는 데 시간이 걸리고 있습니다.</p>
        <p className="mt-1 text-sm text-gray-600">새 탭에서 파일을 확인해주세요.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white">새 탭에서 열기</a>
        <a href={file.url} download={file.filename} rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">다운로드</a>
        {onRetry ? <Button type="button" variant="outline" onClick={onRetry}>다시 시도</Button> : null}
      </div>
    </div>
  );
}

function getPreviewKind(file: AirtableAttachment) {
  const contentType = file.type?.toLowerCase() ?? "";
  const extension = file.filename.split(".").pop()?.toLowerCase();
  if (contentType.startsWith("image/") && ["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) return "image";
  if (contentType === "application/pdf" || extension === "pdf") return "pdf";
  return undefined;
}
