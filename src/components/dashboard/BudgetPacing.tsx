"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { getBudgetAmount, isDailyBudget } from "@/types/meta";

interface BudgetItem { id: string; name: string; daily_budget?: string; lifetime_budget?: string; }

interface BudgetPacingProps {
  spend: number;
  since: string;
  until: string;
}

export default function BudgetPacing({ spend, since, until }: BudgetPacingProps) {
  const [budgetData, setBudgetData] = useState<{ campaigns: BudgetItem[]; adsets: BudgetItem[] } | null>(null);

  useEffect(() => {
    fetch("/api/budget").then((r) => r.json()).then(setBudgetData).catch(() => {});
  }, []);

  if (!budgetData) return null;

  const campDailyTotal = budgetData.campaigns.reduce((s, c) => s + (isDailyBudget(c) ? getBudgetAmount(c) : 0), 0);
  const adsetDailyTotal = budgetData.adsets.reduce((s, a) => s + (isDailyBudget(a) ? getBudgetAmount(a) : 0), 0);
  const dailyTotal = campDailyTotal + adsetDailyTotal;

  if (dailyTotal === 0) return null;

  const sinceMs = new Date(since + "T00:00:00Z").getTime();
  const untilMs = new Date(until + "T00:00:00Z").getTime();
  const nowMs = Date.now();

  const totalDays = Math.max(1, Math.round((untilMs - sinceMs) / 86400000) + 1);
  const elapsedDays = Math.max(1, Math.round((Math.min(nowMs, untilMs) - sinceMs) / 86400000) + 1);

  const expectedSpend = dailyTotal * elapsedDays;
  const projectedTotal = dailyTotal * totalDays;
  const spendPct = Math.min(100, projectedTotal > 0 ? (spend / projectedTotal) * 100 : 0);
  const pacingPct = expectedSpend > 0 ? (spend / expectedSpend) * 100 : 0;

  const isOver = pacingPct > 110;
  const isUnder = pacingPct < 85;
  const barColor = isOver ? "bg-red-500" : isUnder ? "bg-amber-400" : "bg-emerald-500";
  const statusText = isOver ? "과소진" : isUnder ? "저조" : "정상";
  const statusColor = isOver
    ? "text-red-600 bg-red-50"
    : isUnder
    ? "text-amber-600 bg-amber-50"
    : "text-emerald-600 bg-emerald-50";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">예산 소진율</h3>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            실제 소진 <span className="font-semibold text-gray-800">${spend.toFixed(2)}</span>
          </span>
          <span>
            예상 소진 <span className="font-semibold text-gray-800">${expectedSpend.toFixed(2)}</span>
          </span>
          <span>
            기간 예산 <span className="font-semibold text-gray-800">${projectedTotal.toFixed(0)}</span>
          </span>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${spendPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>
            기간 경과 {elapsedDays}/{totalDays}일 ({Math.round((elapsedDays / totalDays) * 100)}%)
          </span>
          <span>
            소진 {spendPct.toFixed(1)}% · 페이싱 {pacingPct.toFixed(0)}%
          </span>
        </div>

        <div className="flex gap-3 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <span>일 예산 기준 <span className="text-gray-600 font-medium">${dailyTotal.toFixed(0)}/일</span></span>
          {campDailyTotal > 0 && <span>캠페인 ${campDailyTotal.toFixed(0)}</span>}
          {adsetDailyTotal > 0 && <span>세트 ${adsetDailyTotal.toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}
