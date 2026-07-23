"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId } from "react";

import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ open, title, description, children, confirmLabel = "확인", cancelLabel = "취소", loading = false, danger = false, error, onConfirm, onClose }: ConfirmDialogProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-lg border border-[var(--border-default)] bg-white p-5 text-left shadow-2xl">
      <div className="flex items-start gap-3"><span className={`mt-0.5 rounded-full p-2 ${danger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}><AlertTriangle aria-hidden="true" size={18} /></span><div className="min-w-0 flex-1"><h2 id={titleId} className="text-base font-bold text-[var(--text-primary)]">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p> : null}</div><button type="button" aria-label="닫기" title="닫기" disabled={loading} onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X aria-hidden="true" size={18} /></button></div>
      {children ? <div className="mt-4">{children}</div> : null}
      {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2"><Button autoFocus type="button" variant="outline" disabled={loading} onClick={onClose}>{cancelLabel}</Button><Button type="button" variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div>
    </div>
  </div>;
}
