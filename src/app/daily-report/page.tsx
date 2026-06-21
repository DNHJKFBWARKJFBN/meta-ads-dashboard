"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DollarSign, TrendingUp, MousePointerClick, BarChart2, Menu, AlertCircle, ShoppingCart, Wallet, Eye, Percent, Target, ChevronDown, ChevronUp, Users, ShoppingBag, Banknote } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import { MetaCampaign, insightToMetrics, getRevenue, getConversions, getAddToCart, getAddToCartValue } from "@/types/meta";
import { useDashboard, DATE_LABELS } from "@/lib/context";
import { resolveDateRange, formatDateRangeLabel, pstDateString, shiftDate } from "@/lib/time";
import { DatePreset } from "@/types/meta";

interface Summary {
  spend: number;
  revenue: number;
  revenueKrw: number;
  clicks: number;
  impressions: number;
  reach: number;
  addToCart: number;
  addToCartValue: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cvr: number;
  roas: number;
}

function computeTotals(data: MetaCampaign[], rate: number | null): Summary {
  const totals = data.reduce(
    (acc, c) => {
      const ins = c.insights?.data?.[0];
      if (!ins) return acc;
      return {
        spend: acc.spend + parseFloat(ins.spend || "0"),
        revenue: acc.revenue + getRevenue(ins),
        clicks: acc.clicks + parseInt(ins.inline_link_clicks || "0"),
        impressions: acc.impressions + parseInt(ins.impressions || "0"),
        reach: acc.reach + parseInt(ins.reach || "0"),
        addToCart: acc.addToCart + getAddToCart(ins),
        addToCartValue: acc.addToCartValue + getAddToCartValue(ins),
        conversions: acc.conversions + getConversions(ins),
      };
    },
    { spend: 0, revenue: 0, clicks: 0, impressions: 0, reach: 0, addToCart: 0, addToCartValue: 0, conversions: 0 }
  );
  return {
    spend: totals.spend,
    revenue: totals.revenue,
    revenueKrw: rate ? totals.revenue * rate : 0,
    clicks: totals.clicks,
    impressions: totals.impressions,
    reach: totals.reach,
    addToCart: totals.addToCart,
    addToCartValue: totals.addToCartValue,
    conversions: totals.conversions,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    cvr: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
    roas: totals.spend > 0 && totals.revenue > 0 ? totals.revenue / totals.spend : 0,
  };
}

function getPrevParam(preset: DatePreset): string | null {
  const today = pstDateString();
  switch (preset) {
    case "today": {
      const y = shiftDate(today, -1);
      return `since=${y}&until=${y}`;
    }
    case "yesterday": {
      const y = shiftDate(today, -2);
      return `since=${y}&until=${y}`;
    }
    case "last_7d":
      return `since=${shiftDate(today, -14)}&until=${shiftDate(today, -8)}`;
    case "last_14d":
      return `since=${shiftDate(today, -28)}&until=${shiftDate(today, -15)}`;
    case "last_30d":
      return `since=${shiftDate(today, -60)}&until=${shiftDate(today, -31)}`;
    default:
      return null;
  }
}

function pctChange(current: number, prev: number): number | undefined {
  if (prev === 0 || !isFinite(prev)) return undefined;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export default function DailyReportPage() {
  const { setSidebarOpen, dateParam, datePreset, customRange } = useDashboard();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const prevParam = useMemo(() => getPrevParam(datePreset), [datePreset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetches: Promise<Response>[] = [
        fetch(`/api/campaigns?level=campaign&${dateParam}`),
        fetch(`/api/exchange-rate`),
      ];
      if (prevParam) fetches.push(fetch(`/api/campaigns?level=campaign&${prevParam}`));

      const [res, rateRes, prevRes] = await Promise.all(fetches);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data: MetaCampaign[] = json.data ?? [];
      setCampaigns(data);

      const rateJson = await rateRes.json();
      const rate = typeof rateJson.rate === "number" ? rateJson.rate : null;
      setExchangeRate(rate);

      setSummary(computeTotals(data, rate));

      if (prevRes) {
        const prevJson = await prevRes.json();
        const prevData: MetaCampaign[] = prevJson.data ?? [];
        setPrevSummary(computeTotals(prevData, rate));
      } else {
        setPrevSummary(null);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dateParam, prevParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rangeLabel = formatDateRangeLabel(resolveDateRange(datePreset, customRange));
  const dateLabel = datePreset === "custom"
    ? rangeLabel
    : `${DATE_LABELS[datePreset]} (${rangeLabel})`;

  const activeCampaigns = campaigns.filter((c) => c.insights?.data?.[0]);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-700">일일 리포트</h2>
          <p className="text-xs text-gray-400">{dateLabel} 기준 · PST</p>
        </div>
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

        {/* KPI */}
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

        {/* 세부 지표 토글 */}
        {!loading && summary && (
          <div>
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              세부 지표 {showDetail ? "숨기기" : "더보기"}
            </button>
            {showDetail && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <KpiCard title="노출 수" value={summary.impressions.toLocaleString()} icon={Eye} color="bg-cyan-500" />
                <KpiCard title="도달 수" value={summary.reach.toLocaleString()} icon={Users} color="bg-violet-500" />
                <KpiCard title="장바구니 담기 수" value={summary.addToCart.toLocaleString()} icon={ShoppingBag} color="bg-pink-500" />
                <KpiCard title="장바구니 담기 전환 값" value={summary.addToCartValue > 0 ? `$${summary.addToCartValue.toFixed(2)}` : "-"} icon={Banknote} color="bg-lime-600" />
              </div>
            )}
          </div>
        )}

        {/* 캠페인별 요약 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">캠페인별 성과</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 min-w-[200px]">캠페인</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">광고비</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">매출</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">ROAS</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">클릭</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">CTR</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                )) : activeCampaigns.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">해당 기간 데이터가 없습니다.</td></tr>
                ) : activeCampaigns
                  .map((c) => ({ c, m: insightToMetrics(c.insights!.data[0]) }))
                  .sort((a, b) => b.m.spend - a.m.spend)
                  .map(({ c, m }) => {
                    const roasColor = m.roas >= 3 ? "text-emerald-600" : m.roas >= 1 ? "text-indigo-600" : "text-red-500";
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800 max-w-[240px] truncate" title={c.name}>{c.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {c.status === "ACTIVE" ? "활성" : "일시중지"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">${m.spend.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{m.revenue > 0 ? `$${m.revenue.toFixed(2)}` : "-"}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${roasColor}`}>{m.roas > 0 ? `${(m.roas * 100).toFixed(0)}%` : "-"}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{m.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{m.ctr.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
