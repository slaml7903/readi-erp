type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "불러오는 중입니다.",
}: LoadingStateProps) {
  return <p className="p-8 text-center text-sm text-gray-500">{message}</p>;
}
