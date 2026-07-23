"use client";

import { useResizableColumns } from "@/components/ui/DataTable";
import { formatDateTime } from "@/lib/date";

import type { VehicleDrivingLog } from "../types/vehicle.type";

const LOG_COLUMNS = [
  ["start", "출발일시", 165], ["end", "도착일시", 165], ["vehicle", "차량", 120],
  ["department", "부서", 110], ["driver", "운전자", 110], ["destination", "행선지", 160],
  ["odometer", "주행전/후", 150], ["distance", "운행거리", 110], ["hours", "운행시간", 105],
  ["fuel", "주유금액", 115], ["status", "상태", 95], ["memo", "비고", 180],
].map(([key, label, defaultWidth]) => ({ key: String(key), label: String(label), defaultWidth: Number(defaultWidth), minWidth: 75 }));

function nullableNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}${suffix}`;
}

export default function VehicleLogTable({ logs }: { logs: VehicleDrivingLog[] }) {
  const table = useResizableColumns("vehicle-logs", LOG_COLUMNS);
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
        조회 조건에 맞는 운행기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {table.hasCustomWidths ? <div className="hidden justify-end border-b border-gray-100 px-3 py-2 lg:flex"><button type="button" onClick={table.resetAll} className="text-xs text-gray-500 hover:text-gray-900">컬럼 너비 초기화</button></div> : null}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed divide-y divide-gray-200 text-sm [&_td]:text-center" style={{ minWidth: 1200 }}>
          <colgroup>{LOG_COLUMNS.map((column) => <col key={column.key} style={table.getColumnStyle(column.key)} />)}</colgroup>
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {LOG_COLUMNS.map((column) => <th key={column.key} className="relative px-4 py-3 text-center">{column.label}{table.renderResizeHandle(column.key)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.logId} className="align-top hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.startedAt ? formatDateTime(log.startedAt) : "날짜 없음"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{log.endedAt ? formatDateTime(log.endedAt) : "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{log.vehicleNumber || "-"}</td>
                <td className="px-4 py-3 text-gray-700">{log.department || "-"}</td>
                <td className="px-4 py-3 text-gray-700">{log.driverName || "-"}</td>
                <td className="max-w-52 px-4 py-3 text-gray-700">{log.destination || "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                  {nullableNumber(log.odometerBefore)} / {nullableNumber(log.odometerAfter)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">{nullableNumber(log.distance, " km")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">{nullableNumber(log.drivingHours, "시간")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">{nullableNumber(log.fuelAmount, "원")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.status || "-"}</td>
                <td className="max-w-64 px-4 py-3 text-gray-500">{log.memo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {logs.map((log) => (
          <article key={log.logId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{log.vehicleNumber || "차량번호 없음"}</p>
                <p className="mt-0.5 text-sm text-gray-500">{log.startedAt ? formatDateTime(log.startedAt) : "출발일시 없음"}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{log.status || "-"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">부서 / 운전자</span><span className="text-right text-gray-800">{log.department || "-"} / {log.driverName || "-"}</span>
              <span className="text-gray-500">행선지</span><span className="text-right text-gray-800">{log.destination || "-"}</span>
              <span className="text-gray-500">도착</span><span className="text-right text-gray-800">{log.endedAt ? formatDateTime(log.endedAt) : "-"}</span>
              <span className="text-gray-500">운행거리</span><span className="text-right text-gray-800">{nullableNumber(log.distance, " km")}</span>
              <span className="text-gray-500">주유금액</span><span className="text-right text-gray-800">{nullableNumber(log.fuelAmount, "원")}</span>
            </div>
            {log.memo && <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{log.memo}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
