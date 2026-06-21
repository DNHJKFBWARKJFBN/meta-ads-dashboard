"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu, AlertCircle, Clock } from "lucide-react";
import { useDashboard } from "@/lib/context";

interface AttendanceRow { date: string; checkIn: string; checkOut: string; totalHours: string; checked: boolean; }

const NON_WORK_LABELS = ["주말", "공휴일", "휴무"];

function parseHM(str: string): number {
  const m = /^(\d+):(\d{2})$/.exec(str.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export default function WorkAttendancePage() {
  const { setSidebarOpen } = useDashboard();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/work/attendance");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRows(json.rows ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const workedDays = rows.filter((r) => !NON_WORK_LABELS.includes(r.checkIn) && r.checkIn !== "");
  const totalMinutes = rows.reduce((sum, r) => sum + parseHM(r.totalHours), 0);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-700">브랜드 출퇴근 기록표</h2>
          <p className="text-xs text-gray-400">근무일 {workedDays.length}일 기록</p>
        </div>
      </header>

      <main className="p-5 md:p-6 space-y-5">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">시트 연동 실패</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={15} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700">출퇴근 기록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 min-w-[110px]">날짜</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">출근</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">퇴근</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">총 업무 시간</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(4)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                )) : rows.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">기록이 없습니다.</td></tr>
                ) : rows.map((r) => {
                  const isOff = NON_WORK_LABELS.includes(r.checkIn) || r.checkIn === "";
                  return (
                    <tr key={r.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{r.date}</td>
                      <td className={`px-4 py-3 text-right ${isOff ? "text-gray-400" : "text-gray-700"}`}>{r.checkIn || "-"}</td>
                      <td className={`px-4 py-3 text-right ${isOff ? "text-gray-400" : "text-gray-700"}`}>{r.checkOut || "-"}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isOff ? "text-gray-400" : "text-indigo-600"}`}>{r.totalHours || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
              {!loading && rows.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                    <td className="px-5 py-3 text-sm text-gray-700">합계</td>
                    <td></td>
                    <td></td>
                    <td className="px-4 py-3 text-right text-indigo-600">{formatMinutes(totalMinutes)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
