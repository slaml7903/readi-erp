type EmptyStateProps = {
  message?: string;
};

export default function EmptyState({
  message = "데이터가 없습니다.",
}: EmptyStateProps) {
  return <p className="p-8 text-center text-sm text-gray-500">{message}</p>;
}
