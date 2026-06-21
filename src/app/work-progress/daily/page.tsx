"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { useDashboard } from "@/lib/context";

interface DailyProgressRow { checked: boolean; date: string; tasks: string; }

export default function WorkDailyPage() {
  const { setSidebarOpen } = useDashboard();
  const [rows, setRows] = useState<DailyProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/work/daily");
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

  const withTasks = rows.filter((r) => r.tasks.trim() !== "");
  const completedCount = withTasks.filter((r) => r.checked).length;

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-700">브랜드 일일 업무 진행표</h2>
          <p className="text-xs text-gray-400">{completedCount}/{withTasks.length} 완료</p>
        </div>
      </header>

      <main className="p-5 md:p-6 space-y-3">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">시트 연동 실패</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
            </div>
          </div>
        )}

        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-16 animate-pulse border border-gray-100" />
        )) : rows.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">업무 데이터가 없습니다.</p>
        ) : rows.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3">
            {r.checked ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700">{r.date}</p>
              {r.tasks ? (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line break-words">{r.tasks}</p>
              ) : (
                <p className="text-sm text-gray-300 mt-1">-</p>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
