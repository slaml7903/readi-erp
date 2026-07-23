type StatusBadgeProps = {
  status?: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = status ?? "-";
  const colorClass = getStatusColor(label);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
}

function getStatusColor(status: string) {
  if (["승인완료", "입고완료", "검토완료", "지출완료", "완료", "정상"].includes(status)) {
    return "bg-green-100 text-green-700";
  }

  if (["요청됨", "승인대기", "검토대기", "지출대기", "발주전", "발주필요"].includes(status)) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (["반려", "거부됨", "오류", "품절", "재고오류"].includes(status)) {
    return "bg-red-100 text-red-700";
  }

  if (["보류"].includes(status)) {
    return "bg-orange-100 text-orange-700";
  }

  if (["선구매", "발주완료", "배송중", "진행중", "운행중"].includes(status)) {
    return "bg-blue-100 text-blue-700";
  }

  if (["취소", "미사용", "기준미설정"].includes(status)) {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-gray-100 text-gray-700";
}
