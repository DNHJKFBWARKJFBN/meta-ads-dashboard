"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { DailyMetric } from "@/types/meta";

interface ClicksChartProps {
  data: DailyMetric[];
}

export default function ClicksChart({ data }: ClicksChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">일별 클릭 & CTR</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v, name) => [name === "ctr" ? `${Number(v).toFixed(2)}%` : Number(v).toLocaleString(), name === "ctr" ? "CTR" : "클릭"]} />
          <Bar yAxisId="left" dataKey="clicks" fill="#f59e0b" radius={[4, 4, 0, 0]} name="clicks" />
          <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={2} dot={false} name="ctr" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
