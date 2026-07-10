type ErrorStateProps = {
  message?: string;
};

export default function ErrorState({
  message = "오류가 발생했습니다.",
}: ErrorStateProps) {
  return <p className="p-8 text-center text-sm text-red-600">{message}</p>;
}
