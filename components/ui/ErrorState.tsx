type ErrorStateProps = {
  message?: string;
};

export default function ErrorState({
  message = "오류가 발생했습니다.",
}: ErrorStateProps) {
  return <div className="flex items-center justify-center gap-2 p-8 text-center text-sm text-red-700"><CircleAlert aria-hidden="true" size={18} />{message}</div>;
}
import { CircleAlert } from "lucide-react";
