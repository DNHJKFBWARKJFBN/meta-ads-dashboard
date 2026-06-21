"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DollarSign, TrendingUp, MousePointerClick, BarChart2, RefreshCw, AlertCircle, Menu, ShoppingCart, Wallet, Eye, Percent, Target, ChevronDown } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import SpendRevenueChart from "@/components/charts/SpendRevenueChart";
import RoasChart from "@/components/charts/RoasChart";
import DailyTrendChart from "@/components/charts/DailyTrendChart";
import { MetaCampaign, insightToMetrics, getRevenue, getConversions } from "@/types/meta";
import { useDashboard } from "@/lib/context";
import { formatDateRangeLabel, pstDateString } from "@/lib/time";

const YEARS = [2026, 2025];
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function currentYearMonth(): { year: number; month: number } {
  const [y, m] = pstDateString().split("-").map(Number);
  return { year: y, month: m };
}

function monthRange(year: number, month: number): { since: string; until: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const since = `${year}-${pad(month)}-01`;
  const { year: cy, month: cm } = currentYearMonth();
  if (year === cy && month === cm) {
    return { since, until: pstDateString() };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return { since, until: `${year}-${pad(month)}-${pad(lastDay)}` };
}

function prevOf(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function pctChange(current: number, prev: number): number | undefined {
  if (prev === 0 || !isFinite(prev)) return undefined;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function MonthPicker({
  year,
  month,
  currentYear,
  currentMonth,
  onSelect,
}: {
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
  onSelect: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tabYear, setTabYear] = useState(year);

  const isThisMonth = year === currentYear && month === currentMonth;
  const label = isThisMonth ? "이번 달" : `${String(year).slice(2)}년 ${month}월`;

  return (
    <div className="relative">
      <button
        onClick={() => { setTabYear(year); setOpen((v) => !v); }}
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
      >
        {label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
            <div className="flex gap-1 mb-2">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setTabYear(y)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tabYear === y ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_LABELS.map((ml, i) => {
                const m = i + 1;
                const selected = tabYear === year && m === month;
                const isCur = tabYear === currentYear && m === currentMonth;
                return (
                  <button
                    key={m}
                    onClick={() => { onSelect(tabYear, m); setOpen(false); }}
                    className={`relative py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selected ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {ml}
                    {isCur && !selected && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

function computeSummary(data: MetaCampaign[], rate: number | null): Summary {
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
  return {
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
  };
}

export default function OverviewPage() {
  const { setSidebarOpen } = useDashboard();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState(currentYearMonth);

  const range = useMemo(() => monthRange(selected.year, selected.month), [selected.year, selected.month]);
  const prev = useMemo(() => prevOf(selected.year, selected.month), [selected.year, selected.month]);
  const prevRange = useMemo(() => monthRange(prev.year, prev.month), [prev.year, prev.month]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, prevRes, rateRes] = await Promise.all([
        fetch(`/api/campaigns?level=campaign&since=${range.since}&until=${range.until}`),
        fetch(`/api/campaigns?level=campaign&since=${prevRange.since}&until=${prevRange.until}`),
        fetch(`/api/exchange-rate`),
      ]);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data: MetaCampaign[] = json.data ?? [];
      setCampaigns(data);

      const prevJson = await prevRes.json();
      const prevData: MetaCampaign[] = prevJson.data ?? [];

      const rateJson = await rateRes.json();
      const rate = typeof rateJson.rate === "number" ? rateJson.rate : null;
      setExchangeRate(rate);

      setSummary(computeSummary(data, rate));
      setPrevSummary(computeSummary(prevData, rate));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range.since, range.until, prevRange.since, prevRange.until]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const chartData = campaigns
    .filter((c) => c.insights?.data?.[0])
    .map((c) => {
      const m = insightToMetrics(c.insights!.data[0]);
      return { name: c.name, spend: m.spend, revenue: m.revenue, roas: m.roas };
    });

  const rangeLabel = formatDateRangeLabel(range);
  const { year: curYear, month: curMonth } = currentYearMonth();

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <h2 className="text-sm font-semibold text-gray-700 flex-1">전체 성과</h2>
        <MonthPicker
          year={selected.year}
          month={selected.month}
          currentYear={curYear}
          currentMonth={curMonth}
          onSelect={(y, m) => setSelected({ year: y, month: m })}
        />
        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">{rangeLabel} · PST</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? [...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />
          )) : summary ? (<>
            <KpiCard
              title="총 광고비" value={`$${summary.spend.toFixed(2)}`}
              change={pctChange(summary.spend, prevSummary?.spend ?? 0)}
              icon={DollarSign} color="bg-indigo-500"
            />
            <KpiCard
              title="총 매출" value={summary.revenue > 0 ? `$${summary.revenue.toFixed(2)}` : "-"}
              change={pctChange(summary.revenue, prevSummary?.revenue ?? 0)}
              icon={TrendingUp} color="bg-emerald-500"
            />
            <KpiCard
              title="한화 매출" value={summary.revenueKrw > 0 ? `₩${Math.round(summary.revenueKrw).toLocaleString()}` : "-"}
              sub={exchangeRate ? `1$ = ₩${exchangeRate.toFixed(0)}` : undefined}
              icon={Wallet} color="bg-teal-500"
            />
            <KpiCard
              title="총 전환" value={summary.conversions.toLocaleString()}
              change={pctChange(summary.conversions, prevSummary?.conversions ?? 0)}
              icon={ShoppingCart} color="bg-fuchsia-500"
            />
            <KpiCard
              title="총 로아스" value={summary.roas > 0 ? `${(summary.roas * 100).toFixed(0)}%` : "-"}
              change={pctChange(summary.roas, prevSummary?.roas ?? 0)}
              icon={BarChart2} color={summary.roas >= 3 ? "bg-emerald-500" : summary.roas >= 1 ? "bg-indigo-500" : "bg-red-500"}
            />
            <KpiCard
              title="CPC" value={summary.cpc > 0 ? `$${summary.cpc.toFixed(2)}` : "-"}
              change={pctChange(summary.cpc, prevSummary?.cpc ?? 0)}
              changePositive={false}
              icon={MousePointerClick} color="bg-amber-500"
            />
            <KpiCard
              title="CPM" value={summary.cpm > 0 ? `$${summary.cpm.toFixed(2)}` : "-"}
              change={pctChange(summary.cpm, prevSummary?.cpm ?? 0)}
              changePositive={false}
              icon={Eye} color="bg-sky-500"
            />
            <KpiCard
              title="CTR" value={`${summary.ctr.toFixed(2)}%`}
              change={pctChange(summary.ctr, prevSummary?.ctr ?? 0)}
              icon={Percent} color="bg-orange-500"
            />
            <KpiCard
              title="CVR" value={`${summary.cvr.toFixed(2)}%`}
              change={pctChange(summary.cvr, prevSummary?.cvr ?? 0)}
              icon={Target} color="bg-rose-500"
            />
          </>) : null}
        </div>

        {/* 일별 추이 차트 */}
        {!loading && <DailyTrendChart since={range.since} until={range.until} />}

        {/* 캠페인 차트 */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendRevenueChart data={chartData} />
            <RoasChart data={chartData} />
          </div>
        )}

        {!loading && chartData.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">해당 기간에 집행된 캠페인이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
