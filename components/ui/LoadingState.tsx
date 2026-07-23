type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "불러오는 중입니다.",
}: LoadingStateProps) {
  return <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--text-secondary)]"><LoaderCircle aria-hidden="true" size={17} className="animate-spin" />{message}</div>;
}
import { LoaderCircle } from "lucide-react";
