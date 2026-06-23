"use client";

import { useEffect, useState, useRef } from "react";
import { Wallet, Pencil, Check, X } from "lucide-react";

const STORAGE_KEY = "meta_monthly_budget";

interface CampaignInsight {
  spend?: string;
}
interface Campaign {
  insights?: { data?: CampaignInsight[] };
}

export default function MonthlyBudget() {
  const [budget, setBudget] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [monthSpend, setMonthSpend] = useState<number | null>(null);
  const [loadingSpend, setLoadingSpend] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBudget(parseFloat(saved));
  }, []);

  useEffect(() => {
    setLoadingSpend(true);
    fetch("/api/campaigns?level=campaign&date_preset=this_month")
      .then((r) => r.json())
      .then((d) => {
        const campaigns: Campaign[] = d.data ?? [];
        const total = campaigns.reduce((sum, c) => {
          const ins = c.insights?.data?.[0];
          return sum + parseFloat(ins?.spend || "0");
        }, 0);
        setMonthSpend(total);
      })
      .catch(() => setMonthSpend(null))
      .finally(() => setLoadingSpend(false));
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function startEdit() {
    setInputVal(budget != null ? String(budget) : "");
    setEditing(true);
  }

  function confirmEdit() {
    const v = parseFloat(inputVal.replace(/,/g, ""));
    if (!isNaN(v) && v > 0) {
      setBudget(v);
      localStorage.setItem(STORAGE_KEY, String(v));
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  const spend = monthSpend ?? 0;
  const pct = budget && budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;
  const remaining = budget ? Math.max(0, budget - spend) : null;
  const isOver = pct >= 100;
  const isWarning = pct >= 80 && pct < 100;
  const barColor = isOver ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-indigo-500";
  const statusText = isOver ? "초과" : isWarning ? "주의" : budget ? "정상" : null;
  const statusColor = isOver
    ? "text-red-600 bg-red-50"
    : isWarning
    ? "text-amber-600 bg-amber-50"
    : "text-emerald-600 bg-emerald-50";

  // Get current month label
  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}월`;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={16} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">{monthLabel} 월 예산 소진율</h3>
        {statusText && (
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {statusText}
          </span>
        )}
      </div>

      {/* Budget input row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400">월 예산</span>
        {editing ? (
          <>
            <span className="text-xs text-gray-500">$</span>
            <input
              ref={inputRef}
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
              className="w-32 text-sm font-semibold border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="0"
            />
            <button onClick={confirmEdit} className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50">
              <Check size={14} />
            </button>
            <button onClick={cancelEdit} className="p-1 rounded-md text-gray-400 hover:bg-gray-50">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-gray-800">
              {budget != null ? `$${budget.toLocaleString()}` : <span className="text-gray-400">미설정</span>}
            </span>
            <button onClick={startEdit} className="p-1 rounded-md text-gray-400 hover:bg-gray-50 hover:text-indigo-500">
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>

      {budget != null && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              이번 달 소진{" "}
              <span className="font-semibold text-gray-800">
                {loadingSpend ? "..." : `$${spend.toFixed(2)}`}
              </span>
            </span>
            <span>
              잔여{" "}
              <span className={`font-semibold ${isOver ? "text-red-500" : "text-gray-800"}`}>
                {remaining != null ? (isOver ? `-$${(spend - budget).toFixed(2)}` : `$${remaining.toFixed(2)}`) : "-"}
              </span>
            </span>
            <span>
              월 예산{" "}
              <span className="font-semibold text-gray-800">${budget.toLocaleString()}</span>
            </span>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            <span>소진 {pct.toFixed(1)}%</span>
            <span>
              {now.getDate()}일 경과 / {new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}일
            </span>
          </div>
        </div>
      )}

      {budget == null && (
        <p className="text-xs text-gray-400 text-center py-2">
          월 예산을 입력하면 소진율을 확인할 수 있어요.
        </p>
      )}
    </div>
  );
}
