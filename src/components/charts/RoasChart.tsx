"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface RoasChartProps { data: { name: string; roas: number }[]; }

function roasColor(roas: number) {
  if (roas >= 3) return "#10b981";
  if (roas >= 1) return "#6366f1";
  return "#ef4444";
}

export default function RoasChart({ data }: RoasChartProps) {
  const top8 = [...data].sort((a, b) => b.roas - a.roas).slice(0, 8).map((d) => ({
    ...d,
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
  }));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">캠페인별 ROAS</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={top8} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-30} textAnchor="end" tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}x`, "ROAS"]} />
          <Bar dataKey="roas" name="ROAS" radius={[4, 4, 0, 0]}>
            {top8.map((entry, i) => (
              <Cell key={i} fill={roasColor(entry.roas)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
