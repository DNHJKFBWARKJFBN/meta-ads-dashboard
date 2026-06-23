"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertCircle, Menu } from "lucide-react";
import LiveBudget from "@/components/dashboard/LiveBudget";
import SpendRevenueChart from "@/components/charts/SpendRevenueChart";
import RoasChart from "@/components/charts/RoasChart";
import DrilldownTable from "@/components/dashboard/DrilldownTable";
import TopCreatives from "@/components/dashboard/TopCreatives";
import BudgetPacing from "@/components/dashboard/BudgetPacing";
import MonthlyBudget from "@/components/dashboard/MonthlyBudget";
import AudienceInsights from "@/components/dashboard/AudienceInsights";
import ObjectiveKpis from "@/components/dashboard/ObjectiveKpis";
import Memo from "@/components/dashboard/Memo";
import { MetaCampaign, insightToMetrics, getRevenue, getConversions } from "@/types/meta";
import { useDashboard, DATE_LABELS } from "@/lib/context";
import { resolveDateRange, formatDateRangeLabel } from "@/lib/time";

interface Summary {
  spend: number;
  revenue: number;
  revenueKrw: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cvr: number;
  roas: number;
}

export default function MetaBephorPage() {
  const { dateParam, datePreset, customRange, setSidebarOpen } = useDashboard();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, rateRes] = await Promise.all([
        fetch(`/api/campaigns?level=campaign&${dateParam}`),
        fetch(`/api/exchange-rate`),
      ]);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data: MetaCampaign[] = json.data ?? [];
      setCampaigns(data);

      const rateJson = await rateRes.json();
      const rate = typeof rateJson.rate === "number" ? rateJson.rate : null;
      setExchangeRate(rate);

      const totals = data.reduce(
        (acc, c) => {
          const ins = c.insights?.data?.[0];
          if (!ins) return acc;
          return {
            spend: acc.spend + parseFloat(ins.spend || "0"),
            revenue: acc.revenue + getRevenue(ins),
            clicks: acc.clicks + parseInt(ins.inline_link_clicks || "0"),
            impressions: acc.impressions + parseInt(ins.impressions || "0"),
            conversions: acc.conversions + getConversions(ins),
          };
        },
        { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 }
      );

      setSummary({
        spend: totals.spend,
        revenue: totals.revenue,
        revenueKrw: rate ? totals.revenue * rate : 0,
        clicks: totals.clicks,
        impressions: totals.impressions,
        conversions: totals.conversions,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        cvr: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
        roas: totals.spend > 0 && totals.revenue > 0 ? totals.revenue / totals.spend : 0,
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dateParam]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const chartData = campaigns
    .filter((c) => c.insights?.data?.[0])
    .map((c) => {
      const m = insightToMetrics(c.insights!.data[0]);
      return { name: c.name, spend: m.spend, revenue: m.revenue, roas: m.roas };
    });

  const resolvedRange = resolveDateRange(datePreset, customRange);
  const rangeLabel = formatDateRangeLabel(resolvedRange);
  const dateLabel = datePreset === "custom"
    ? rangeLabel
    : `${DATE_LABELS[datePreset]} (${rangeLabel})`;

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <h2 className="text-sm font-semibold text-gray-700 flex-1">메타_BEPHOR_자사몰</h2>
        <span className="text-xs text-gray-400 whitespace-nowrap">{dateLabel} · PST</span>
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

        {/* KPI Cards — split by campaign objective */}
        <ObjectiveKpis campaigns={campaigns} exchangeRate={exchangeRate} loading={loading} />

        {/* Live Budget */}
        <LiveBudget />

        {/* Monthly Budget */}
        <MonthlyBudget />

        {/* Budget Pacing */}
        {!loading && summary && resolvedRange && (
          <BudgetPacing spend={summary.spend} since={resolvedRange.since} until={resolvedRange.until} />
        )}

        {/* Charts */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendRevenueChart data={chartData} />
            <RoasChart data={chartData} />
          </div>
        )}

        {/* Drilldown Table */}
        <DrilldownTable activeOnly />

        {/* Top Creatives */}
        <TopCreatives />

        {/* Audience Demographics */}
        <AudienceInsights />

        {/* Memo */}
        <Memo />
      </main>
    </div>
  );
}
