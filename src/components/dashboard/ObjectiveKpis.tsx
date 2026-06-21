"use client";

import { useState } from "react";
import { DollarSign, MousePointerClick, BarChart2, Eye, Percent, Globe, TrendingUp, ShoppingCart, Wallet, Target, Link, ChevronDown } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import { MetaCampaign, MetaInsight, getRevenue, getConversions } from "@/types/meta";

function getLandingPageViews(ins: MetaInsight): number {
  return parseInt(ins.actions?.find((a) => a.action_type === "landing_page_view")?.value ?? "0");
}

function aggregateConversion(campaigns: MetaCampaign[]) {
  return campaigns.reduce(
    (acc, c) => {
      const ins = c.insights?.data?.[0];
      if (!ins) return acc;
      const spend = parseFloat(ins.spend || "0");
      const clicks = parseInt(ins.inline_link_clicks || "0");
      const impressions = parseInt(ins.impressions || "0");
      const conversions = getConversions(ins);
      const revenue = getRevenue(ins);
      return {
        spend: acc.spend + spend,
        revenue: acc.revenue + revenue,
        clicks: acc.clicks + clicks,
        impressions: acc.impressions + impressions,
        conversions: acc.conversions + conversions,
        cpm: acc.cpm + parseFloat(ins.cpm || "0"),
        cpmCount: acc.cpmCount + 1,
      };
    },
    { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0, cpm: 0, cpmCount: 0 }
  );
}

function aggregateTraffic(campaigns: MetaCampaign[]) {
  return campaigns.reduce(
    (acc, c) => {
      const ins = c.insights?.data?.[0];
      if (!ins) return acc;
      const spend = parseFloat(ins.spend || "0");
      const clicks = parseInt(ins.inline_link_clicks || "0");
      const impressions = parseInt(ins.impressions || "0");
      const lpv = getLandingPageViews(ins);
      return {
        spend: acc.spend + spend,
        clicks: acc.clicks + clicks,
        impressions: acc.impressions + impressions,
        landingPageViews: acc.landingPageViews + lpv,
        cpm: acc.cpm + parseFloat(ins.cpm || "0"),
        cpmCount: acc.cpmCount + 1,
      };
    },
    { spend: 0, clicks: 0, impressions: 0, landingPageViews: 0, cpm: 0, cpmCount: 0 }
  );
}

interface Props {
  campaigns: MetaCampaign[];
  exchangeRate: number | null;
  loading: boolean;
}

export default function ObjectiveKpis({ campaigns, exchangeRate, loading }: Props) {
  const [convOpen, setConvOpen] = useState(false);
  const [trafficOpen, setTrafficOpen] = useState(false);

  const convCampaigns = campaigns.filter((c) => c.objective === "OUTCOME_SALES");
  const trafficCampaigns = campaigns.filter((c) => c.objective === "OUTCOME_TRAFFIC");

  const cv = aggregateConversion(convCampaigns);
  const cvRoas = cv.spend > 0 && cv.revenue > 0 ? cv.revenue / cv.spend : 0;
  const cvCpc = cv.clicks > 0 ? cv.spend / cv.clicks : 0;
  const cvCtr = cv.impressions > 0 ? (cv.clicks / cv.impressions) * 100 : 0;
  const cvCpm = cv.cpmCount > 0 ? cv.cpm / cv.cpmCount : 0;
  const cvCvr = cv.clicks > 0 ? (cv.conversions / cv.clicks) * 100 : 0;

  const tr = aggregateTraffic(trafficCampaigns);
  const trCpc = tr.clicks > 0 ? tr.spend / tr.clicks : 0;
  const trCtr = tr.impressions > 0 ? (tr.clicks / tr.impressions) * 100 : 0;
  const trCpm = tr.cpmCount > 0 ? tr.cpm / tr.cpmCount : 0;
  const trLpvRate = tr.clicks > 0 ? (tr.landingPageViews / tr.clicks) * 100 : 0;

  const skeleton = [...Array(7)].map((_, i) => (
    <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />
  ));

  return (
    <div className="space-y-3">
      {/* 전환 캠페인 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setConvOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShoppingCart size={11} />
            전환 캠페인
          </span>
          {!loading && (
            <span className="text-xs text-gray-400">{convCampaigns.length}개 캠페인</span>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            {!convOpen && !loading && (
              <span className="hidden sm:inline">클릭해서 펼치기</span>
            )}
            <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${convOpen ? "rotate-180" : ""}`} />
          </span>
        </button>

        {convOpen && (
          <div className="px-5 pb-5">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{skeleton}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard title="총 광고비" value={`$${cv.spend.toFixed(2)}`} icon={DollarSign} color="bg-indigo-500" />
                <KpiCard title="총 매출" value={cv.revenue > 0 ? `$${cv.revenue.toFixed(2)}` : "$0.00"} icon={TrendingUp} color="bg-emerald-500" />
                <KpiCard
                  title="한화 매출"
                  value={exchangeRate ? `₩${Math.round(cv.revenue * exchangeRate).toLocaleString()}` : "-"}
                  sub={exchangeRate ? `1$ = ₩${exchangeRate.toFixed(0)}` : undefined}
                  icon={Wallet}
                  color="bg-teal-500"
                />
                <KpiCard title="총 전환" value={cv.conversions.toLocaleString()} icon={ShoppingCart} color="bg-fuchsia-500" />
                <KpiCard
                  title="총 로아스"
                  value={cvRoas > 0 ? `${(cvRoas * 100).toFixed(0)}%` : "0%"}
                  icon={BarChart2}
                  color={cvRoas >= 3 ? "bg-emerald-500" : cvRoas >= 1 ? "bg-indigo-500" : "bg-red-500"}
                />
                <KpiCard title="CPC" value={cvCpc > 0 ? `$${cvCpc.toFixed(2)}` : "$0.00"} icon={MousePointerClick} color="bg-amber-500" />
                <KpiCard title="CPM" value={cvCpm > 0 ? `$${cvCpm.toFixed(2)}` : "$0.00"} icon={Eye} color="bg-sky-500" />
                <KpiCard title="CTR" value={`${cvCtr.toFixed(2)}%`} icon={Percent} color="bg-orange-500" />
                <KpiCard title="CVR" value={`${cvCvr.toFixed(2)}%`} icon={Target} color="bg-rose-500" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 트래픽 캠페인 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setTrafficOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <Globe size={11} />
            트래픽 캠페인
          </span>
          {!loading && (
            <span className="text-xs text-gray-400">{trafficCampaigns.length}개 캠페인</span>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            {!trafficOpen && !loading && (
              <span className="hidden sm:inline">클릭해서 펼치기</span>
            )}
            <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${trafficOpen ? "rotate-180" : ""}`} />
          </span>
        </button>

        {trafficOpen && (
          <div className="px-5 pb-5">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{skeleton}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard title="총 광고비" value={`$${tr.spend.toFixed(2)}`} icon={DollarSign} color="bg-indigo-500" />
                <KpiCard title="CPC (링크 클릭당)" value={trCpc > 0 ? `$${trCpc.toFixed(2)}` : "$0.00"} icon={MousePointerClick} color="bg-amber-500" />
                <KpiCard title="CTR (링크 클릭률)" value={`${trCtr.toFixed(2)}%`} icon={Percent} color="bg-orange-500" />
                <KpiCard title="CPM" value={trCpm > 0 ? `$${trCpm.toFixed(2)}` : "$0.00"} icon={Eye} color="bg-sky-500" />
                <KpiCard title="링크 클릭 수" value={tr.clicks.toLocaleString()} icon={Link} color="bg-violet-500" />
                <KpiCard title="랜딩페이지 조회" value={tr.landingPageViews.toLocaleString()} icon={Globe} color="bg-cyan-500" />
                <KpiCard title="랜딩페이지 조회율" value={`${trLpvRate.toFixed(2)}%`} icon={Target} color="bg-teal-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
