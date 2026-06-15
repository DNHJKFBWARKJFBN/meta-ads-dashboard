"use client";

import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color: string;
  prefix?: string;
  suffix?: string;
}

export default function KpiCard({ title, value, change, icon: Icon, color, prefix = "", suffix = "" }: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">
        {prefix}{value}{suffix}
      </div>
      {change !== undefined && (
        <div className={`mt-1 text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% 전월 대비
        </div>
      )}
    </div>
  );
}
