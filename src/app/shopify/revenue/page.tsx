"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, AlertCircle, Menu } from "lucide-react";
import { useDashboard } from "@/lib/context";
import { resolveDateRange } from "@/lib/time";

interface Order {
  id: number;
  created_at: string;
  financial_status: string;
  total_price: string;
  subtotal_price: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ShopifyRevenuePage() {
  const { datePreset, customRange, setSidebarOpen } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  const resolved = resolveDateRange(datePreset, customRange);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (resolved) { qs.set("since", resolved.since); qs.set("until", resolved.until); }
    fetch(`/api/shopify/orders?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setOrders(d.orders ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolved?.since, resolved?.until, refreshKey]);

  const paidOrders = orders.filter((o) => o.financial_status === "paid");
  const filtered = dayFilter !== null ? paidOrders.filter((o) => new Date(o.created_at).getDay() === dayFilter) : paidOrders;
  const totalRevenue = filtered.reduce((s, o) => s + parseFloat(o.total_price), 0);

  // 날짜별 매출
  const dateMap: Record<string, number> = {};
  filtered.forEach((o) => {
    const d = o.created_at.slice(0, 10);
    dateMap[d] = (dateMap[d] || 0) + parseFloat(o.total_price);
  });
  const dateEntries = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDateRevenue = Math.max(...Object.values(dateMap), 1);

  // 요일별 매출
  const dayRevenue: Record<number, number> = {};
  paidOrders.forEach((o) => {
    const d = new Date(o.created_at).getDay();
    dayRevenue[d] = (dayRevenue[d] || 0) + parseFloat(o.total_price);
  });
  const maxDayRevenue = Math.max(...Object.values(dayRevenue), 1);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <TrendingUp size={15} className="text-emerald-500" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">BEPHOR_쇼피파이 · 매출</h2>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "총 매출", value: loading ? "-" : `$${totalRevenue.toFixed(2)}`, color: "text-emerald-600" },
            { label: "결제 완료 주문", value: loading ? "-" : `${filtered.length}건`, color: "text-gray-800" },
            { label: "평균 주문금액", value: loading ? "-" : filtered.length > 0 ? `$${(totalRevenue / filtered.length).toFixed(2)}` : "$0.00", color: "text-gray-800" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* 요일별 매출 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-4">요일별 매출</p>
          <div className="flex gap-2 items-end h-24">
            {DAY_LABELS.map((label, i) => {
              const rev = dayRevenue[i] || 0;
              const pct = (rev / maxDayRevenue) * 100;
              const active = dayFilter === i;
              return (
                <button key={i} onClick={() => setDayFilter(active ? null : i)} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 tabular-nums">${rev.toFixed(0)}</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct * 0.7, 4)}px`, background: active ? "#10b981" : "#d1fae5" }} />
                  <span className={`text-[11px] font-medium ${active ? "text-emerald-600" : "text-gray-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
          {dayFilter !== null && (
            <p className="text-xs text-emerald-500 mt-2 text-center">{DAY_LABELS[dayFilter]}요일 필터 적용 중 · 클릭해서 해제</p>
          )}
        </div>

        {/* 날짜별 매출 */}
        {!loading && dateEntries.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-4">날짜별 매출</p>
            <div className="space-y-2">
              {dateEntries.map(([date, rev]) => {
                const pct = (rev / maxDateRevenue) * 100;
                const dayIdx = new Date(date).getDay();
                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 shrink-0">{date} ({DAY_LABELS[dayIdx]})</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-20 text-right tabular-nums">${rev.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
