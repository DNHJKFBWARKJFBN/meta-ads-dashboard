"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { useDashboard } from "@/lib/context";

interface SheetField {
  type: "daily" | "attendance";
  title: string;
  description: string;
}

const FIELDS: SheetField[] = [
  { type: "daily", title: "브랜드 일일 업무 진행표", description: "매달 새로 만드는 탭의 URL을 붙여넣으세요." },
  { type: "attendance", title: "브랜드 출퇴근 기록표", description: "매달 새로 만드는 탭의 URL을 붙여넣으세요." },
];

export default function WorkSettingsPage() {
  const { setSidebarOpen } = useDashboard();
  const [currentGids, setCurrentGids] = useState<{ dailyProgressGid: string; attendanceGid: string } | null>(null);
  const [inputs, setInputs] = useState<{ daily: string; attendance: string }>({ daily: "", attendance: "" });
  const [saving, setSaving] = useState<{ daily: boolean; attendance: boolean }>({ daily: false, attendance: false });
  const [message, setMessage] = useState<{ type: "daily" | "attendance"; text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/work/settings");
      const json = await res.json();
      setCurrentGids({ dailyProgressGid: json.dailyProgressGid, attendanceGid: json.attendanceGid });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);

  async function save(type: "daily" | "attendance") {
    const value = inputs[type].trim();
    if (!value) return;
    setSaving((s) => ({ ...s, [type]: true }));
    setMessage(null);
    try {
      const res = await fetch("/api/work/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMessage({ type, text: `반영되었습니다 (gid: ${json.gid})`, ok: true });
      setInputs((s) => ({ ...s, [type]: "" }));
      fetchCurrent();
    } catch (e: unknown) {
      setMessage({ type, text: (e as Error).message, ok: false });
    } finally {
      setSaving((s) => ({ ...s, [type]: false }));
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-700">시트 설정</h2>
          <p className="text-xs text-gray-400">매달 새 탭이 생기면 여기에 새 링크를 붙여넣으세요. 저장 즉시 반영됩니다.</p>
        </div>
      </header>

      <main className="p-5 md:p-6 space-y-4">
        {FIELDS.map((f) => {
          const current = currentGids ? (f.type === "daily" ? currentGids.dailyProgressGid : currentGids.attendanceGid) : null;
          return (
            <div key={f.type} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Settings size={15} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-700">{f.title}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">{f.description}</p>
              <p className="text-xs text-gray-400 mb-3">
                현재 연결된 gid: <span className="font-mono text-gray-600">{loading ? "..." : current}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputs[f.type]}
                  onChange={(e) => setInputs((s) => ({ ...s, [f.type]: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=123456789#gid=123456789"
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => save(f.type)}
                  disabled={saving[f.type] || !inputs[f.type].trim()}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg transition-colors shrink-0"
                >
                  저장
                </button>
              </div>
              {message?.type === f.type && (
                <div className={`flex items-center gap-1.5 mt-2 text-xs ${message.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {message.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {message.text}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
