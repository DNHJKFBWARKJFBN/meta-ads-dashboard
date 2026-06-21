"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Star, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MetaAd, MetaInsight, insightToMetrics, getRevenue } from "@/types/meta";
import { pstDateString, shiftDate } from "@/lib/time";

function roasBadge(roas: number) {
  if (roas >= 3) return "bg-emerald-100 text-emerald-700";
  if (roas >= 1) return "bg-indigo-100 text-indigo-700";
  return "bg-red-100 text-red-600";
}

interface DayRow { date: string; spend: number; revenue: number; roas: number; }

function CreativeModal({ ad, onClose }: { ad: MetaAd; onClose: () => void }) {
  const [days, setDays] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const until = pstDateString();
  const since = shiftDate(until, -29);

  useEffect(() => {
    fetch(`/api/ad-insights?ad_id=${ad.id}&since=${since}&until=${until}`)
      .then((r) => r.json())
      .then((json) => {
        const rows: DayRow[] = (json.data ?? []).map((ins: MetaInsight) => {
          const spend = parseFloat(ins.spend || "0");
          const revenue = getRevenue(ins);
          const [, m, d] = ins.date_start.split("-").map(Number);
          return { date: `${m}/${d}`, spend, revenue, roas: spend > 0 ? revenue / spend : 0 };
        });
        setDays(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ad.id, since, until]);

  const totalSpend = days.reduce((s, r) => s + r.spend, 0);
  const totalRevenue = days.reduce((s, r) => s + r.revenue, 0);
  const overallRoas = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : 0;
  const roasColor = overallRoas >= 3 ? "bg-emerald-50 text-emerald-700" : overallRoas >= 1 ? "bg-indigo-50 text-indigo-700" : "bg-red-50 text-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-sm font-semibold text-gray-800 truncate pr-4">{ad.name}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 썸네일 + 요약 지표 */}
          <div className="flex gap-4 items-start">
            {ad.creative?.thumbnail_url && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <Image src={ad.creative.thumbnail_url} alt={ad.name} fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-[10px] text-indigo-500 mb-0.5">광고비 (30일)</p>
                <p className="text-sm font-bold text-indigo-700">${totalSpend.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-[10px] text-emerald-600 mb-0.5">매출 (30일)</p>
                <p className="text-sm font-bold text-emerald-700">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className={`rounded-xl p-3 ${roasColor}`}>
                <p className="text-[10px] mb-0.5 opacity-70">ROAS</p>
                <p className="text-sm font-bold">{overallRoas > 0 ? `${overallRoas.toFixed(2)}x` : "-"}</p>
              </div>
            </div>
          </div>

          {/* 일별 차트 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">최근 30일 일별 성과</p>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : days.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={days} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    interval={Math.ceil(days.length / 8)}
                  />
                  <YAxis
                    yAxisId="money"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={45}
                  />
                  <YAxis
                    yAxisId="roas"
                    orientation="right"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v.toFixed(1)}x`}
                    width={35}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const v = Number(value);
                      return name === "ROAS" ? [`${v.toFixed(2)}x`, name as string] : [`$${v.toFixed(2)}`, name as string];
                    }}
                  />
                  <Line yAxisId="money" type="monotone" dataKey="spend" name="광고비" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="money" type="monotone" dataKey="revenue" name="매출" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="roas" type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">최근 30일 데이터가 없습니다.</p>
            )}
          </div>

          {/* 인스타 링크 */}
          {ad.creative?.instagram_permalink_url && (
            <a
              href={ad.creative.instagram_permalink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <ExternalLink size={12} />
              인스타그램에서 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopCreatives() {
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MetaAd | null>(null);

  useEffect(() => {
    fetch("/api/creative")
      .then((r) => r.json())
      .then((json) => {
        const data: MetaAd[] = json.data ?? [];
        const withInsights = data
          .filter((ad) => ad.insights?.data?.[0] && ad.creative?.thumbnail_url)
          .map((ad) => ({ ...ad, _metrics: insightToMetrics(ad.insights!.data[0]) }))
          .sort((a, b) => (b as MetaAd & { _metrics: ReturnType<typeof insightToMetrics> })._metrics.roas - (a as MetaAd & { _metrics: ReturnType<typeof insightToMetrics> })._metrics.roas)
          .slice(0, 5) as MetaAd[];
        setAds(withInsights);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Star size={15} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-700">전일 효율 상위 소재</h3>
          <span className="ml-auto text-xs text-gray-400">클릭하면 30일 성과 확인</span>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl aspect-square" />
              ))}
            </div>
          ) : ads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">전일 소재 데이터가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ads.map((ad, i) => {
                const m = ad.insights?.data?.[0] ? insightToMetrics(ad.insights.data[0]) : null;
                return (
                  <button
                    key={ad.id}
                    onClick={() => setSelected(ad)}
                    className="relative group text-left focus:outline-none"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-indigo-400 transition-all">
                      {ad.creative?.thumbnail_url ? (
                        <Image src={ad.creative.thumbnail_url} alt={ad.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">소재 없음</div>
                      )}
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 truncate" title={ad.name}>{ad.name}</p>
                    {m && (
                      <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roasBadge(m.roas)}`}>
                        ROAS {m.roas > 0 ? m.roas.toFixed(2) : "-"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && <CreativeModal ad={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
