import { formatDateTime } from "@/lib/date";

import type { VehicleDrivingLog } from "../types/vehicle.type";

function nullableNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}${suffix}`;
}

export default function VehicleLogTable({ logs }: { logs: VehicleDrivingLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
        조회 조건에 맞는 운행기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1200px] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">출발일시</th>
              <th className="px-4 py-3">도착일시</th>
              <th className="px-4 py-3">차량</th>
              <th className="px-4 py-3">부서</th>
              <th className="px-4 py-3">운전자</th>
              <th className="px-4 py-3">행선지</th>
              <th className="px-4 py-3 text-right">주행전/후</th>
              <th className="px-4 py-3 text-right">운행거리</th>
              <th className="px-4 py-3 text-right">운행시간</th>
              <th className="px-4 py-3 text-right">주유금액</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">비고</th>
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
