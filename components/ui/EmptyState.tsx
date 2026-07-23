import { Inbox } from "lucide-react";

type EmptyStateProps = {
  message?: string;
};

export default function EmptyState({
  message = "표시할 데이터가 없습니다.",
}: EmptyStateProps) {
  return <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-[var(--text-secondary)]"><Inbox aria-hidden="true" size={28} className="mb-2 text-slate-300" /><p>{message}</p></div>;
}
