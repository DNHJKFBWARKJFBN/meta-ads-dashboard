"use client";

import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  change?: number;
  changePositive?: boolean; // true(default) = 상승이 좋음, false = 하락이 좋음 (CPC, CPM 등)
  icon: LucideIcon;
  color: string;
}

export default function KpiCard({ title, value, sub, change, changePositive = true, icon: Icon, color }: KpiCardProps) {
  const hasChange = change !== undefined;
  const isGood = hasChange ? (changePositive ? change! > 0 : change! < 0) : false;
  const isBad = hasChange ? (changePositive ? change! < 0 : change! > 0) : false;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className="text-lg md:text-2xl font-bold text-gray-800 leading-tight break-words">{value}</div>
      <div className="mt-1.5 flex items-center gap-2 min-h-[18px]">
        {hasChange && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
            isGood ? "bg-emerald-50 text-emerald-600" : isBad ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
          }`}>
            {change! > 0 ? "▲" : change! < 0 ? "▼" : "–"} {Math.abs(change!).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
