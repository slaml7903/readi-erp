import type { AttendanceSummary } from "../types/attendance.type";
import type { SummaryCardKey } from "../types/attendance-calendar.type";

function SummaryButton({
  title,
  value,
  onClick,
}: {
  title: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </button>
  );
}

export default function AttendanceSummaryCards({
  summary,
  onSelectCard,
}: {
  summary: AttendanceSummary;
  onSelectCard: (cardKey: SummaryCardKey) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <SummaryButton
        title="전체"
        value={summary.activeEmployeeCount}
        onClick={() => onSelectCard("all")}
      />
      <SummaryButton
        title="출장"
        value={summary.businessTripCount}
        onClick={() => onSelectCard("businessTrip")}
      />
      <SummaryButton
        title="외근"
        value={summary.outsideWorkCount}
        onClick={() => onSelectCard("outsideWork")}
      />
      <SummaryButton
        title="오전반차"
        value={summary.morningHalfDayCount}
        onClick={() => onSelectCard("morningHalfDay")}
      />
      <SummaryButton
        title="오후반차"
        value={summary.afternoonHalfDayCount}
        onClick={() => onSelectCard("afternoonHalfDay")}
      />
      <SummaryButton
        title="연차"
        value={summary.annualLeaveCount}
        onClick={() => onSelectCard("annualLeave")}
      />
    </div>
  );
}
