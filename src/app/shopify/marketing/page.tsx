"use client";

import { useEffect, useState } from "react";
import { BarChart2, RefreshCw, AlertCircle, Menu } from "lucide-react";
import { useDashboard } from "@/lib/context";
import { resolveDateRange } from "@/lib/time";

interface ChannelData {
  channel: string;
  orders: number;
  revenue: number;
  newCustomers: number;
  returningCustomers: number;
  byDate: Record<string, { orders: number; revenue: number }>;
}

const CHANNEL_COLORS: Record<string, string> = {
  TikTok: "#010101",
  Facebook: "#1877f2",
  Instagram: "#e1306c",
  Google: "#34a853",
  Email: "#f59e0b",
  Naver: "#03c75a",
  Linktree: "#43e660",
  Direct: "#6366f1",
  Referral: "#8b5cf6",
  Organic: "#06b6d4",
};

function getColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? "#9ca3af";
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ShopifyMarketingPage() {
  const { datePreset, customRange, setSidebarOpen } = useDashboard();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resolved = resolveDateRange(datePreset, customRange);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (resolved) { qs.set("since", resolved.since); qs.set("until", resolved.until); }
    fetch(`/api/shopify/marketing?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setChannels(d.channels ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolved?.since, resolved?.until, refreshKey]);

  const totalOrders = channels.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const maxRevenue = Math.max(...channels.map((c) => c.revenue), 1);

  // 요일별 주문 집계
  const dayRevenue: Record<number, number> = {};
  channels.forEach((ch) => {
    Object.entries(ch.byDate).forEach(([date, data]) => {
      const day = new Date(date).getDay();
      dayRevenue[day] = (dayRevenue[day] || 0) + data.revenue;
    });
  });
  const maxDayRevenue = Math.max(...Object.values(dayRevenue), 1);

  // 날짜별 채널 트렌드
  const allDates = [...new Set(channels.flatMap((c) => Object.keys(c.byDate)))].sort();
  const top5 = channels.slice(0, 5);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <BarChart2 size={15} className="text-purple-500" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">BEPHOR_쇼피파이 · 마케팅</h2>
        <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </header>

      <main className="p-5 md:p-6 space-y-5">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "총 주문", value: loading ? "-" : `${totalOrders}건`, color: "text-gray-800" },
            { label: "총 매출", value: loading ? "-" : `$${totalRevenue.toFixed(2)}`, color: "text-emerald-600" },
            { label: "활성 채널", value: loading ? "-" : `${channels.length}개`, color: "text-purple-600" },
            { label: "평균 주문금액", value: loading ? "-" : totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : "$0.00", color: "text-gray-800" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* 채널별 매출 분포 */}
        {!loading && channels.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-4">채널별 매출 기여</p>
            <div className="space-y-3">
              {channels.map((ch) => {
                const pct = (ch.revenue / maxRevenue) * 100;
                const revPct = totalRevenue > 0 ? ((ch.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
                const aov = ch.orders > 0 ? ch.revenue / ch.orders : 0;
                return (
                  <div key={ch.channel}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getColor(ch.channel) }} />
                      <span className="text-xs font-medium text-gray-700 flex-1">{ch.channel}</span>
                      <span className="text-xs text-gray-400">{ch.orders}건</span>
                      <span className="text-xs text-gray-400">AOV ${aov.toFixed(2)}</span>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">${ch.revenue.toFixed(2)}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{revPct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: getColor(ch.channel) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 요일별 매출 */}
        {!loading && channels.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-4">요일별 매출</p>
            <div className="flex gap-2 items-end h-20">
              {DAY_LABELS.map((label, i) => {
                const rev = dayRevenue[i] || 0;
                const pct = (rev / maxDayRevenue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-400 tabular-nums">${rev.toFixed(0)}</span>
                    <div className="w-full rounded-t-md" style={{ height: `${Math.max(pct * 0.7, 4)}px`, background: "#a78bfa" }} />
                    <span className="text-[11px] text-gray-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 날짜별 채널 트렌드 */}
        {!loading && allDates.length > 1 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <p className="text-xs font-semibold text-gray-500">날짜별 채널 매출 추이</p>
              <div className="flex flex-wrap gap-3">
                {top5.map((ch) => (
                  <span key={ch.channel} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: getColor(ch.channel) }} />
                    {ch.channel}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-px items-end" style={{ minHeight: 80 }}>
                {allDates.slice(-60).map((date) => {
                  const maxVal = Math.max(...top5.map((ch) => ch.byDate[date]?.revenue || 0), 1);
                  return (
                    <div key={date} className="flex flex-col-reverse gap-px flex-1 min-w-[6px]" title={date}>
                      {top5.map((ch) => {
                        const val = ch.byDate[date]?.revenue || 0;
                        const h = Math.round((val / maxVal) * 60);
                        return h > 0 ? (
                          <div key={ch.channel} className="w-full rounded-sm" style={{ height: h, background: getColor(ch.channel) }} />
                        ) : null;
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{allDates[0]}</span>
                <span className="text-[10px] text-gray-400">{allDates[allDates.length - 1]}</span>
              </div>
            </div>
          </div>
        )}

        {/* 상세 테이블 */}
        {!loading && channels.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">채널 상세</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">채널</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">주문</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">매출</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">AOV</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">신규</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">재구매</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">매출 비중</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {channels.map((ch) => {
                    const aov = ch.orders > 0 ? ch.revenue / ch.orders : 0;
                    const revPct = totalRevenue > 0 ? (ch.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={ch.channel} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getColor(ch.channel) }} />
                            <span className="font-medium text-gray-700">{ch.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{ch.orders}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium tabular-nums">${ch.revenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">${aov.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-blue-600 tabular-nums">{ch.newCustomers}</td>
                        <td className="px-4 py-3 text-right text-indigo-600 tabular-nums">{ch.returningCustomers}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${revPct}%`, background: getColor(ch.channel) }} />
                            </div>
                            <span className="text-gray-500 tabular-nums w-8">{revPct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && channels.length === 0 && !error && (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
            <p className="text-sm text-gray-400">해당 기간의 마케팅 데이터가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
