"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useDashboard } from "@/lib/context";

interface BreakdownAction {
  action_type: string;
  value: string;
}

interface BreakdownRow {
  age?: string;
  gender?: string;
  region?: string;
  spend: string;
  impressions?: string;
  inline_link_clicks?: string;
  actions?: BreakdownAction[];
}

const AGE_ORDER = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDER_LABELS: Record<string, string> = { female: "여성", male: "남성", unknown: "미확인" };
const GENDER_BAR: Record<string, string> = { female: "bg-pink-400", male: "bg-blue-400", unknown: "bg-gray-300" };
const GENDER_CARD_BG: Record<string, string> = { female: "bg-pink-50", male: "bg-blue-50", unknown: "bg-gray-50" };
const GENDER_TEXT: Record<string, string> = { female: "text-pink-500", male: "text-blue-500", unknown: "text-gray-400" };
const GENDER_BOLD: Record<string, string> = { female: "text-pink-700", male: "text-blue-700", unknown: "text-gray-600" };

const TABS = [
  { label: "전체", value: null },
  { label: "트래픽", value: "OUTCOME_TRAFFIC" },
  { label: "전환 (구매)", value: "OUTCOME_SALES" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

interface DemoData {
  ageGender: BreakdownRow[];
  region: BreakdownRow[];
}

export default function AudienceInsights() {
  const { dateParam } = useDashboard();
  const [activeTab, setActiveTab] = useState<TabValue>(null);
  const [cache, setCache] = useState<Record<string, DemoData>>({});
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => { if (typeof d.rate === "number") setRate(d.rate); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cacheKey = `${activeTab ?? "__all__"}__${dateParam}`;
    if (cache[cacheKey]) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    const qs = new URLSearchParams(dateParam);
    if (activeTab) qs.set("objective", activeTab);

    fetch(`/api/demographics?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setCache((prev) => ({ ...prev, [cacheKey]: { ageGender: d.ageGender ?? [], region: d.region ?? [] } }));
      })
      .catch(() => setError("데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, [activeTab, dateParam, cache]);

  const cacheKey = `${activeTab ?? "__all__"}__${dateParam}`;
  const data = cache[cacheKey];
  const ageGender = data?.ageGender ?? [];
  const region = data?.region ?? [];

  const ageMap: Record<string, number> = {};
  const ageClicks: Record<string, number> = {};
  const ageImpressions: Record<string, number> = {};
  const ageLpv: Record<string, number> = {};
  ageGender.forEach((r) => {
    if (!r.age) return;
    ageMap[r.age] = (ageMap[r.age] || 0) + parseFloat(r.spend || "0");
    ageClicks[r.age] = (ageClicks[r.age] || 0) + parseInt(r.inline_link_clicks || "0");
    ageImpressions[r.age] = (ageImpressions[r.age] || 0) + parseInt(r.impressions || "0");
    const lpvAction = r.actions?.find((a) => a.action_type === "landing_page_view");
    ageLpv[r.age] = (ageLpv[r.age] || 0) + (lpvAction ? parseInt(lpvAction.value) : 0);
  });
  const totalAge = Object.values(ageMap).reduce((s, v) => s + v, 0);
  const ages = AGE_ORDER.filter((a) => ageMap[a] > 0);

  const genderMap: Record<string, number> = {};
  const genderClicks: Record<string, number> = {};
  const genderImpressions: Record<string, number> = {};
  const genderLpv: Record<string, number> = {};
  ageGender.forEach((r) => {
    if (!r.gender) return;
    genderMap[r.gender] = (genderMap[r.gender] || 0) + parseFloat(r.spend || "0");
    genderClicks[r.gender] = (genderClicks[r.gender] || 0) + parseInt(r.inline_link_clicks || "0");
    genderImpressions[r.gender] = (genderImpressions[r.gender] || 0) + parseInt(r.impressions || "0");
    const lpvAction = r.actions?.find((a) => a.action_type === "landing_page_view");
    genderLpv[r.gender] = (genderLpv[r.gender] || 0) + (lpvAction ? parseInt(lpvAction.value) : 0);
  });
  const totalGender = Object.values(genderMap).reduce((s, v) => s + v, 0);
  const genders = ["female", "male", "unknown"].filter((g) => genderMap[g] > 0);

  const regionMap: Record<string, number> = {};
  region.forEach((r) => { if (r.region) regionMap[r.region] = (regionMap[r.region] || 0) + parseFloat(r.spend || "0"); });
  const topRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalRegion = topRegions.reduce((s, [, v]) => s + v, 0);

  function fmtKrw(usd: number) {
    if (!rate) return `$${usd.toFixed(0)}`;
    return `₩${Math.round(usd * rate).toLocaleString()}`;
  }

  const isEmpty = !loading && !error && ages.length === 0 && genders.length === 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={15} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">광고 연령 및 성별</h3>
        <span className="ml-auto text-[10px] text-gray-400">상단 날짜 기준</span>
      </div>

      {/* Objective tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => setActiveTab(tab.value)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === tab.value
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-red-400 py-4 text-center">{error}</p>
      ) : isEmpty ? (
        <p className="text-xs text-gray-400 py-6 text-center">해당 기간의 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 연령 */}
            <div>
              <p className="text-xs text-gray-500 mb-3">연령별 광고비 분포</p>
              <div className="space-y-3">
                {ages.map((age) => {
                  const pct = totalAge > 0 ? (ageMap[age] / totalAge) * 100 : 0;
                  const ctr = ageImpressions[age] > 0 ? (ageClicks[age] / ageImpressions[age]) * 100 : 0;
                  const lpvr = ageClicks[age] > 0 ? (ageLpv[age] / ageClicks[age]) * 100 : 0;
                  return (
                    <div key={age}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 w-10 shrink-0">{age}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
                        <span className="text-xs text-gray-400 w-24 text-right tabular-nums">{fmtKrw(ageMap[age])}</span>
                      </div>
                      <div className="flex gap-3 pl-12 mb-1">
                        <span className="text-[10px] text-gray-400">CTR <span className="text-indigo-500 font-medium">{ctr.toFixed(2)}%</span></span>
                        <span className="text-[10px] text-gray-400">LPV율 <span className="text-emerald-500 font-medium">{lpvr > 0 ? `${lpvr.toFixed(1)}%` : "-"}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 성별 */}
            <div>
              <p className="text-xs text-gray-500 mb-3">성별 광고비 분포</p>
              <div className="space-y-3 mb-4">
                {genders.map((g) => {
                  const pct = totalGender > 0 ? (genderMap[g] / totalGender) * 100 : 0;
                  const ctr = genderImpressions[g] > 0 ? (genderClicks[g] / genderImpressions[g]) * 100 : 0;
                  const lpvr = genderClicks[g] > 0 ? (genderLpv[g] / genderClicks[g]) * 100 : 0;
                  return (
                    <div key={g}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 w-12 shrink-0">{GENDER_LABELS[g]}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${GENDER_BAR[g]}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
                        <span className="text-xs text-gray-400 w-24 text-right tabular-nums">{fmtKrw(genderMap[g])}</span>
                      </div>
                      <div className="flex gap-3 pl-14 mb-1">
                        <span className="text-[10px] text-gray-400">CTR <span className="text-indigo-500 font-medium">{ctr.toFixed(2)}%</span></span>
                        <span className="text-[10px] text-gray-400">LPV율 <span className="text-emerald-500 font-medium">{lpvr > 0 ? `${lpvr.toFixed(1)}%` : "-"}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {genders.map((g) => {
                  const pct = totalGender > 0 ? (genderMap[g] / totalGender) * 100 : 0;
                  return (
                    <div key={g} className={`${GENDER_CARD_BG[g]} rounded-xl p-3 text-center`}>
                      <p className={`text-[11px] mb-1 ${GENDER_TEXT[g]}`}>{GENDER_LABELS[g]}</p>
                      <p className={`text-xl font-bold ${GENDER_BOLD[g]}`}>{pct.toFixed(0)}%</p>
                      <p className={`text-[10px] mt-0.5 ${GENDER_TEXT[g]} tabular-nums`}>{fmtKrw(genderMap[g])}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 지역 */}
          {topRegions.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3">노출 지역 광고비 분포 (상위 8개)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {topRegions.map(([reg, spend]) => {
                  const pct = totalRegion > 0 ? (spend / totalRegion) * 100 : 0;
                  return (
                    <div key={reg} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{reg}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
                      <span className="text-xs text-gray-400 w-24 text-right tabular-nums">{fmtKrw(spend)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
