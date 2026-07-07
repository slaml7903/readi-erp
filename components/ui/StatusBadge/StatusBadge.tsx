type StatusBadgeProps = {
  status?: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = status ?? "-";
  const colorClass = getStatusColor(label);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

function getStatusColor(status: string) {
  if (["승인완료", "입고완료", "발주완료"].includes(status)) {
    return "bg-green-100 text-green-700";
  }

  if (["요청됨", "승인대기", "배송중"].includes(status)) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (["반려", "거부됨", "취소"].includes(status)) {
    return "bg-red-100 text-red-700";
  }

  if (["보류"].includes(status)) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-gray-100 text-gray-700";
}