"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface BudgetItem { id: string; name: string; daily_budget?: string; lifetime_budget?: string; }

export default function LiveBudget() {
  const [data, setData] = useState<{ campaigns: BudgetItem[]; adsets: BudgetItem[] } | null>(null);

  useEffect(() => {
    fetch("/api/budget").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const totalCampBudget = (data?.campaigns ?? []).reduce((s, c) =>
    s + parseFloat(c.daily_budget ?? c.lifetime_budget ?? "0"), 0);
  const totalAdsetBudget = (data?.adsets ?? []).reduce((s, a) =>
    s + parseFloat(a.daily_budget ?? a.lifetime_budget ?? "0"), 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-700">라이브 예산 현황</h3>
        <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">활성 캠페인</p>
          <p className="text-xl font-bold text-gray-800">{data?.campaigns.length ?? "-"}</p>
          <p className="text-xs text-gray-400 mt-1">예산 ${totalCampBudget.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">활성 광고세트</p>
          <p className="text-xl font-bold text-gray-800">{data?.adsets.length ?? "-"}</p>
          <p className="text-xs text-gray-400 mt-1">예산 ${totalAdsetBudget.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
