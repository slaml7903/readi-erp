"use client";

import { useResizableColumns } from "@/components/ui/DataTable";
import { formatDateTime } from "@/lib/date";

import type { VehicleDisplayStatus, VehicleStatusItem } from "../types/vehicle.type";

const STATUS_COLUMNS = [
  ["number", "차량번호", 130], ["name", "차량명", 150], ["status", "상태", 100],
  ["driver", "운전자", 120], ["destination", "행선지", 180],
  ["startedAt", "출발일시", 170], ["mileage", "최근 주행거리", 150],
].map(([key, label, defaultWidth]) => ({ key: String(key), label: String(label), defaultWidth: Number(defaultWidth), minWidth: 80 }));

function statusClass(status: VehicleDisplayStatus) {
  if (status === "대기중") return "bg-emerald-50 text-emerald-700";
  if (status === "운행중") return "bg-blue-50 text-blue-700";
  if (status === "장기운행중") return "bg-amber-50 text-amber-800";
  return "bg-gray-100 text-gray-600";
}

function StatusBadge({ status }: { status: VehicleDisplayStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
    >
      {status || "-"}
    </span>
  );
}

function formatMileage(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")} km`;
}

export default function VehicleStatusTable({
  vehicles,
}: {
  vehicles: VehicleStatusItem[];
}) {
  const table = useResizableColumns("vehicle-status", STATUS_COLUMNS);
  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
        조회된 차량이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {table.hasCustomWidths ? <ResetWidths onClick={table.resetAll} /> : null}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed divide-y divide-gray-200 text-sm [&_td]:text-center" style={{ minWidth: 1000 }}>
          <colgroup>{STATUS_COLUMNS.map((column) => <col key={column.key} style={table.getColumnStyle(column.key)} />)}</colgroup>
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {STATUS_COLUMNS.map((column) => <th key={column.key} className="relative px-4 py-3 text-center">{column.label}{table.renderResizeHandle(column.key)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map((vehicle) => {
              return (
                <tr
                  key={vehicle.vehicleNumber}
                  className="bg-white"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {vehicle.vehicleNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{vehicle.vehicleName || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={vehicle.displayStatus} /></td>
                  <td className="px-4 py-3 text-gray-700">{vehicle.activeLog?.driverName || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{vehicle.activeLog?.destination || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {vehicle.activeLog?.startedAt ? formatDateTime(vehicle.activeLog.startedAt) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                    {formatMileage(vehicle.recentMileage)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 md:hidden">
        {vehicles.map((vehicle) => (
          <article
            key={vehicle.vehicleNumber}
            className="bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
                <p className="mt-0.5 text-sm text-gray-500">{vehicle.vehicleName || "차량명 없음"}</p>
              </div>
              <StatusBadge status={vehicle.displayStatus} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">운전자</span>
              <span className="text-right text-gray-800">{vehicle.activeLog?.driverName || "-"}</span>
              <span className="text-gray-500">행선지</span>
              <span className="text-right text-gray-800">{vehicle.activeLog?.destination || "-"}</span>
              <span className="text-gray-500">출발</span>
              <span className="text-right text-gray-800">
                {vehicle.activeLog?.startedAt ? formatDateTime(vehicle.activeLog.startedAt) : "-"}
              </span>
              <span className="text-gray-500">최근 주행거리</span>
              <span className="text-right text-gray-800">{formatMileage(vehicle.recentMileage)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ResetWidths({ onClick }: { onClick: () => void }) {
  return <div className="hidden justify-end border-b border-gray-100 px-3 py-2 md:flex"><button type="button" onClick={onClick} className="text-xs text-gray-500 hover:text-gray-900">컬럼 너비 초기화</button></div>;
}
