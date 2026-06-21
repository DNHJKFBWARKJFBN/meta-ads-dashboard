"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartRow { name: string; spend: number; revenue: number; }

interface SpendRevenueChartProps { data: ChartRow[]; }

function truncate(name: string, max: number) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

interface CampaignTickProps { x?: number; y?: number; payload?: { value: string }; }

function CampaignTick({ x = 0, y = 0, payload }: CampaignTickProps) {
  const name = payload?.value ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={10} textAnchor="end" transform="rotate(-40)" fontSize={10} fill="#9ca3af">
        <title>{name}</title>
        {truncate(name, 16)}
      </text>
    </g>
  );
}

export default function SpendRevenueChart({ data }: SpendRevenueChartProps) {
  const top8 = [...data].sort((a, b) => b.spend - a.spend).slice(0, 8);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">광고비 vs 매출 (상위 8개 캠페인)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={top8} margin={{ top: 5, right: 10, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" interval={0} height={70} tick={<CampaignTick />} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} labelFormatter={(label) => label} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="spend" name="광고비" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="revenue" name="매출" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
