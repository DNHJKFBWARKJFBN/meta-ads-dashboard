"use client";

import { useEffect, useState, useCallback } from "react";
import { Eye, MousePointerClick, DollarSign, TrendingUp, Users, BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import SpendChart from "@/components/charts/SpendChart";
import ClicksChart from "@/components/charts/ClicksChart";
import CampaignTable from "@/components/dashboard/CampaignTable";
import DateFilter from "@/components/dashboard/DateFilter";
import { DailyMetric, MetaCampaign } from "@/types/meta";

interface SummaryMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  roas: number;
}

function summarizeInsights(data: {
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  purchase_roas?: { action_type: string; value: string }[];
}[]): SummaryMetrics {
  const totals = data.reduce(
    (acc, d) => ({
      impressions: acc.impressions + parseInt(d.impressions || "0"),
      reach: acc.reach + parseInt(d.reach || "0"),
      clicks: acc.clicks + parseInt(d.clicks || "0"),
      spend: acc.spend + parseFloat(d.spend || "0"),
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0 }
  );

  const last = data[data.length - 1];
  const roas = last?.purchase_roas?.[0] ? parseFloat(last.purchase_roas[0].value) : 0;

  return {
    ...totals,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    roas,
  };
}

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState("last_30d");
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyMetric[]>([]);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insightsRes, campaignsRes, accountRes] = await Promise.all([
        fetch(`/api/meta/insights?date_preset=${datePreset}`),
        fetch("/api/meta/campaigns"),
        fetch("/api/meta/accounts"),
      ]);

      const [insightsJson, campaignsJson, accountJson] = await Promise.all([
        insightsRes.json(),
        campaignsRes.json(),
        accountRes.json(),
      ]);

      if (insightsJson.error) throw new Error(insightsJson.error);
      if (campaignsJson.error) throw new Error(campaignsJson.error);

      const insightData = insightsJson.data ?? [];
      setMetrics(summarizeInsights(insightData));
      setDailyData(
        insightData.map((d: { date_start: string; impressions: string; clicks: string; spend: string; ctr: string }) => ({
          date: d.date_start?.slice(5),
          impressions: parseInt(d.impressions || "0"),
          clicks: parseInt(d.clicks || "0"),
          spend: parseFloat(d.spend || "0"),
          ctr: parseFloat(d.ctr || "0"),
        }))
      );
      setCampaigns(campaignsJson.data ?? []);
      if (accountJson.name) setAccountName(accountJson.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Meta 광고 대시보드</h1>
              {accountName && <p className="text-xs text-gray-400">{accountName}</p>}
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <DateFilter value={datePreset} onChange={setDatePreset} />

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <div>
              <p className="font-medium text-sm">데이터 로드 실패</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs mt-1 text-red-500">
                .env.local 파일에 META_ACCESS_TOKEN과 META_AD_ACCOUNT_ID를 설정했는지 확인하세요.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse h-28" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="총 노출" value={metrics.impressions.toLocaleString()} icon={Eye} color="bg-indigo-500" />
            <KpiCard title="도달" value={metrics.reach.toLocaleString()} icon={Users} color="bg-violet-500" />
            <KpiCard title="클릭" value={metrics.clicks.toLocaleString()} icon={MousePointerClick} color="bg-amber-500" />
            <KpiCard title="총 지출" value={`₩${Math.round(metrics.spend).toLocaleString()}`} icon={DollarSign} color="bg-rose-500" />
            <KpiCard title="CTR" value={metrics.ctr.toFixed(2)} icon={TrendingUp} color="bg-emerald-500" suffix="%" />
            <KpiCard title="CPC" value={`₩${Math.round(metrics.cpc).toLocaleString()}`} icon={MousePointerClick} color="bg-sky-500" />
            <KpiCard title="CPM" value={`₩${Math.round(metrics.cpm).toLocaleString()}`} icon={BarChart2} color="bg-orange-500" />
            <KpiCard title="ROAS" value={metrics.roas.toFixed(2)} icon={TrendingUp} color="bg-pink-500" suffix="x" />
          </div>
        ) : null}

        {!loading && dailyData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendChart data={dailyData} />
            <ClicksChart data={dailyData} />
          </div>
        )}

        {!loading && <CampaignTable campaigns={campaigns} />}
      </main>
    </div>
  );
}
