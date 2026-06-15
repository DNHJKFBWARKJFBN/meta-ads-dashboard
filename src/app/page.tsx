"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, MousePointerClick, BarChart2, RefreshCw, AlertCircle, Menu } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import LiveBudget from "@/components/dashboard/LiveBudget";
import SpendRevenueChart from "@/components/charts/SpendRevenueChart";
import RoasChart from "@/components/charts/RoasChart";
import DrilldownTable from "@/components/dashboard/DrilldownTable";
import TopCreatives from "@/components/dashboard/TopCreatives";
import Memo from "@/components/dashboard/Memo";
import { MetaCampaign, insightToMetrics, getRevenue, getRoas } from "@/types/meta";
import { useDashboard } from "@/lib/context";

interface Summary {
  spend: number;
  revenue: number;
  clicks: number;
  ctr: number;
  roas: number;
}

export default function DashboardPage() {
  const { datePreset, setSidebarOpen } = useDashboard();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns?level=campaign&date_preset=${datePreset}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data: MetaCampaign[] = json.data ?? [];
      setCampaigns(data);

      const totals = data.reduce(
        (acc, c) => {
          const ins = c.insights?.data?.[0];
          if (!ins) return acc;
          return {
            spend: acc.spend + parseFloat(ins.spend || "0"),
            revenue: acc.revenue + getRevenue(ins),
            clicks: acc.clicks + parseInt(ins.clicks || "0"),
            impressions: acc.impressions + parseInt(ins.impressions || "0"),
          };
        },
        { spend: 0, revenue: 0, clicks: 0, impressions: 0 }
      );

      const avgRoas = data
        .map((c) => c.insights?.data?.[0] ? getRoas(c.insights.data[0]) : 0)
        .filter(Boolean);

      setSummary({
        spend: totals.spend,
        revenue: totals.revenue,
        clicks: totals.clicks,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        roas: totals.spend > 0 && totals.revenue > 0 ? totals.revenue / totals.spend : avgRoas.length ? avgRoas.reduce((a, b) => a + b, 0) / avgRoas.length : 0,
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const chartData = campaigns.map((c) => {
    const ins = c.insights?.data?.[0];
    const m = ins ? insightToMetrics(ins) : { spend: 0, revenue: 0, roas: 0, clicks: 0, ctr: 0, impressions: 0, cpc: 0 };
    return { name: c.name, spend: m.spend, revenue: m.revenue, roas: m.roas };
  });

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <h2 className="text-sm font-semibold text-gray-700 flex-1">대시보드 — 전체 뷰</h2>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </header>

      <main className="p-5 md:p-6 space-y-5">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">API 연결 실패</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />
          )) : summary ? (<>
            <KpiCard title="총 광고비" value={`$${summary.spend.toFixed(2)}`} icon={DollarSign} color="bg-indigo-500" />
            <KpiCard title="총 매출" value={summary.revenue > 0 ? `$${summary.revenue.toFixed(0)}` : "-"} icon={TrendingUp} color="bg-emerald-500" />
            <KpiCard title="총 클릭 · CTR" value={summary.clicks.toLocaleString()} sub={`CTR ${summary.ctr.toFixed(2)}%`} icon={MousePointerClick} color="bg-amber-500" />
            <KpiCard title="ROAS" value={summary.roas > 0 ? `${summary.roas.toFixed(2)}x` : "-"} icon={BarChart2} color={summary.roas >= 3 ? "bg-emerald-500" : summary.roas >= 1 ? "bg-indigo-500" : "bg-red-500"} />
          </>) : null}
        </div>

        {/* Live Budget */}
        <LiveBudget />

        {/* Charts */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendRevenueChart data={chartData} />
            <RoasChart data={chartData} />
          </div>
        )}

        {/* Drilldown Table */}
        <DrilldownTable />

        {/* Top Creatives */}
        <TopCreatives />

        {/* Memo */}
        <Memo />
      </main>
    </div>
  );
}
