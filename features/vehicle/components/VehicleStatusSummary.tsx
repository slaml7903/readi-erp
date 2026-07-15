import type { VehicleSummary } from "../types/vehicle.type";

const SUMMARY_ITEMS = [
  { key: "total", label: "전체", tone: "text-gray-900" },
  { key: "waiting", label: "대기", tone: "text-emerald-700" },
  { key: "driving", label: "운행", tone: "text-blue-700" },
  { key: "longDriving", label: "장기", tone: "text-amber-700" },
  { key: "unavailable", label: "사용불가", tone: "text-gray-600" },
] as const;

export default function VehicleStatusSummary({ summary }: { summary: VehicleSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {SUMMARY_ITEMS.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-bold ${item.tone}`}>
            {summary[item.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
