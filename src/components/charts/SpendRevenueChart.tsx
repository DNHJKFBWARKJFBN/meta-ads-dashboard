"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartRow { name: string; spend: number; revenue: number; }

interface SpendRevenueChartProps { data: ChartRow[]; }

export default function SpendRevenueChart({ data }: SpendRevenueChartProps) {
  const top8 = [...data].sort((a, b) => b.spend - a.spend).slice(0, 8).map((d) => ({
    ...d,
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
  }));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">광고비 vs 매출 (상위 8개 캠페인)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={top8} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-30} textAnchor="end" tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="spend" name="광고비" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="revenue" name="매출" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
