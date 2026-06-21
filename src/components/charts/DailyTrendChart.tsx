"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { getRevenue, MetaInsight } from "@/types/meta";

interface DayRow {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
}

export default function DailyTrendChart({ since, until }: { since: string; until: string }) {
  const [data, setData] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/daily-insights?since=${since}&until=${until}`)
      .then((r) => r.json())
      .then((json) => {
        const rows: DayRow[] = (json.data ?? []).map((ins: MetaInsight) => {
          const spend = parseFloat(ins.spend || "0");
          const revenue = getRevenue(ins);
          const [, m, d] = ins.date_start.split("-").map(Number);
          return {
            date: `${m}/${d}`,
            spend: Math.round(spend * 100) / 100,
            revenue: Math.round(revenue * 100) / 100,
            roas: spend > 0 && revenue > 0 ? Math.round((revenue / spend) * 100) / 100 : 0,
          };
        });
        setData(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [since, until]);

  if (loading) return <div className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse" />;
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">일별 성과 추이</h3>
        <span className="ml-auto text-xs text-gray-400">광고비 · 매출 · ROAS</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="money"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v}`}
            width={50}
          />
          <YAxis
            yAxisId="roas"
            orientation="right"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            width={40}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              if (name === "ROAS") return [`${Math.round(v * 100)}%`, name as string];
              return [`$${v.toLocaleString()}`, name as string];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line yAxisId="money" type="monotone" dataKey="spend" name="광고비" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line yAxisId="money" type="monotone" dataKey="revenue" name="매출" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line yAxisId="roas" type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
