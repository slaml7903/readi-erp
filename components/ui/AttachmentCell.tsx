"use client";

import { Download, ExternalLink, FileText } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AttachmentFile = { id: string; url: string; filename: string; type?: string };

export default function AttachmentCell({ files, label = "첨부파일" }: { files?: AttachmentFile[]; label?: string }) {
  const attachments = files ?? [];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [position, setPosition] = useState<{ top: number; left: number }>();

  useEffect(() => {
    if (!position) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setPosition(undefined);
    };
    const close = () => setPosition(undefined);
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  if (attachments.length === 0) return <span className="text-slate-400">-</span>;
  if (attachments.length === 1) {
    const file = attachments[0];
    return <a href={file.url} target="_blank" rel="noopener noreferrer" title={`${label}: ${file.filename}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} className="inline-flex min-h-8 items-center gap-1.5 font-semibold text-[var(--brand-secondary)] hover:underline"><ExternalLink aria-hidden="true" size={14} />열기</a>;
  }

  const toggle = () => {
    if (position) return setPosition(undefined);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 320;
    setPosition({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8)) });
  };

  return <>
    <button ref={triggerRef} type="button" aria-expanded={Boolean(position)} aria-controls={popoverId} onClick={(event) => { event.stopPropagation(); toggle(); }} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Escape") setPosition(undefined); }} className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap font-semibold text-[var(--brand-secondary)] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-secondary)]"><FileText aria-hidden="true" size={14} />파일 {attachments.length}개</button>
    {position ? createPortal(
      <div ref={popoverRef} id={popoverId} role="dialog" aria-label={`${label} 목록`} style={position} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Escape") { setPosition(undefined); triggerRef.current?.focus(); } }} className="fixed z-[60] w-80 rounded-lg border border-[var(--border-default)] bg-white p-2 text-left shadow-xl">
        <p className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">{label} · 파일 {attachments.length}개</p>
        <ul className="max-h-64 overflow-y-auto">{attachments.map((file) => <li key={file.id} className="border-t border-slate-100 px-2 py-2 first:border-0"><div className="flex items-center gap-2"><FileText aria-hidden="true" size={15} className="shrink-0 text-slate-400" /><span title={file.filename} className="min-w-0 flex-1 truncate text-sm">{file.filename}</span><span className="text-[11px] uppercase text-slate-400">{fileType(file)}</span></div><div className="mt-2 flex justify-end gap-3 text-xs"><a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--brand-secondary)]"><ExternalLink aria-hidden="true" size={13} />열기</a><a href={file.url} download={file.filename} rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-600"><Download aria-hidden="true" size={13} />다운로드</a></div></li>)}</ul>
      </div>, document.body) : null}
  </>;
}

function fileType(file: AttachmentFile) {
  const extension = file.filename.split(".").pop();
  return extension && extension !== file.filename ? extension : file.type?.split("/").pop() ?? "file";
}
