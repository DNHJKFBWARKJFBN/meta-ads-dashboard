"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronRight, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { MetaCampaign, MetaAdSet, MetaAd, insightToMetrics, getBudgetAmount, isDailyBudget } from "@/types/meta";
import { useDashboard } from "@/lib/context";

type Level = "campaign" | "adset" | "ad";
type SortKey = "spend" | "revenue" | "roas" | "clicks" | "ctr" | "impressions";

function roasBadge(roas: number) {
  if (roas >= 3) return "text-emerald-600 font-semibold";
  if (roas >= 1) return "text-indigo-600 font-semibold";
  return "text-red-500 font-semibold";
}

const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "활성", cls: "bg-emerald-100 text-emerald-700" },
  PAUSED: { label: "일시중지", cls: "bg-yellow-100 text-yellow-700" },
  ARCHIVED: { label: "보관", cls: "bg-gray-100 text-gray-500" },
};

function getBudgetLabel(row: MetaCampaign | MetaAdSet | MetaAd): string {
  const r = row as MetaCampaign | MetaAdSet;
  const amount = getBudgetAmount(r);
  if (amount <= 0) return "-";
  return `$${amount.toLocaleString()}${isDailyBudget(r) ? "/일" : "(총액)"}`;
}

function SortIcon({ col, sortKey, asc }: { col: SortKey; sortKey: SortKey; asc: boolean }) {
  if (col !== sortKey) return <span className="text-gray-300 ml-1">⇅</span>;
  return asc ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
}

export default function DrilldownTable({ activeOnly = false }: { activeOnly?: boolean }) {
  const { dateParam } = useDashboard();
  const [level, setLevel] = useState<Level>("campaign");
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string; level: Level }[]>([]);
  const [rows, setRows] = useState<(MetaCampaign | MetaAdSet | MetaAd)[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortAsc, setSortAsc] = useState(false);
  const [previewAd, setPreviewAd] = useState<MetaAd | null>(null);

  const fetchRows = useCallback(async (lvl: Level, parentId?: string) => {
    setLoading(true);
    try {
      let url = `/api/campaigns?level=${lvl}&${dateParam}&active_only=${activeOnly}`;
      if (lvl === "adset" && parentId) url += `&campaign_id=${parentId}`;
      if (lvl === "ad" && parentId) url += `&adset_id=${parentId}`;
      const res = await fetch(url);
      const json = await res.json();
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateParam, activeOnly]);

  useEffect(() => {
    setLevel("campaign");
    setBreadcrumb([]);
    fetchRows("campaign");
  }, [dateParam, fetchRows]);

  function drillDown(row: MetaCampaign | MetaAdSet) {
    const nextLevel: Level = level === "campaign" ? "adset" : "ad";
    setBreadcrumb((b) => [...b, { id: row.id, name: row.name, level }]);
    setLevel(nextLevel);
    fetchRows(nextLevel, row.id);
  }

  function navigateTo(idx: number) {
    if (idx < 0) {
      setLevel("campaign");
      setBreadcrumb([]);
      fetchRows("campaign");
    } else {
      const crumb = breadcrumb[idx];
      const nextLevel: Level = crumb.level === "campaign" ? "adset" : "ad";
      const newBc = breadcrumb.slice(0, idx + 1);
      setBreadcrumb(newBc);
      setLevel(nextLevel);
      fetchRows(nextLevel, crumb.id);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...rows].sort((a, b) => {
    const ai = a.insights?.data?.[0];
    const bi = b.insights?.data?.[0];
    const am = ai ? insightToMetrics(ai) : { spend: 0, revenue: 0, roas: 0, clicks: 0, ctr: 0, impressions: 0, cpc: 0 };
    const bm = bi ? insightToMetrics(bi) : { spend: 0, revenue: 0, roas: 0, clicks: 0, ctr: 0, impressions: 0, cpc: 0 };
    const diff = am[sortKey] - bm[sortKey];
    return sortAsc ? diff : -diff;
  });

  const totals = rows.reduce((acc, row) => {
    const budget = acc.budget + getBudgetAmount(row as MetaCampaign | MetaAdSet);
    const ins = row.insights?.data?.[0];
    if (!ins) return { ...acc, budget };
    const m = insightToMetrics(ins);
    return { spend: acc.spend + m.spend, revenue: acc.revenue + m.revenue, clicks: acc.clicks + m.clicks, impressions: acc.impressions + m.impressions, budget };
  }, { spend: 0, revenue: 0, clicks: 0, impressions: 0, budget: 0 });

  const levelLabel: Record<Level, string> = { campaign: "캠페인", adset: "광고세트", ad: "광고" };
  const showBudget = level !== "ad";
  const colCount = 8 + (showBudget ? 1 : 0) + (level !== "campaign" ? 1 : 0);

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th onClick={() => toggleSort(col)} className="text-right px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800">
        {label}<SortIcon col={col} sortKey={sortKey} asc={sortAsc} />
      </th>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Breadcrumb */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <button onClick={() => navigateTo(-1)} className={`text-sm font-semibold ${level === "campaign" ? "text-gray-800" : "text-indigo-500 hover:underline"}`}>
          광고 데이터
        </button>
        {breadcrumb.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-400" />
            <button onClick={() => navigateTo(i)} className={`text-sm font-semibold ${i === breadcrumb.length - 1 ? "text-gray-800" : "text-indigo-500 hover:underline"}`}>
              {b.name.length > 20 ? b.name.slice(0, 20) + "…" : b.name}
            </button>
          </span>
        ))}
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{levelLabel[level]}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 min-w-[200px]">이름</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">상태</th>
              {showBudget && (
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                  {level === "campaign" ? "캠페인 예산" : "세트 예산"}
                </th>
              )}
              <Th col="spend" label="광고비" />
              <Th col="revenue" label="매출" />
              <Th col="roas" label="ROAS" />
              <Th col="clicks" label="클릭" />
              <Th col="ctr" label="CTR" />
              <Th col="impressions" label="노출" />
              {level !== "campaign" && <th className="px-5 py-3 text-xs font-medium text-gray-500"></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(colCount)].map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : sorted.map((row) => {
              const ins = row.insights?.data?.[0];
              const m = ins ? insightToMetrics(ins) : null;
              const st = STATUS[row.status] ?? { label: row.status, cls: "bg-gray-100 text-gray-500" };
              const isAd = level === "ad";
              const ad = row as MetaAd;
              const canDrill = level !== "ad";

              return (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {isAd && ad.creative?.thumbnail_url && (
                        <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-100 cursor-pointer" onClick={() => setPreviewAd(ad)}>
                          <Image src={ad.creative.thumbnail_url} alt={row.name} fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <span
                        className={`font-medium text-gray-800 truncate max-w-[240px] ${canDrill ? "cursor-pointer hover:text-indigo-600" : ""}`}
                        title={row.name}
                        onClick={() => canDrill && drillDown(row as MetaCampaign | MetaAdSet)}
                      >
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  {showBudget && (
                    <td className="px-4 py-3 text-right text-gray-600">{getBudgetLabel(row)}</td>
                  )}
                  <td className="px-4 py-3 text-right text-gray-700">{m ? `$${m.spend.toFixed(2)}` : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{m && m.revenue > 0 ? `$${m.revenue.toFixed(2)}` : "-"}</td>
                  <td className={`px-4 py-3 text-right ${m ? roasBadge(m.roas) : "text-gray-400"}`}>{m && m.roas > 0 ? `${(m.roas * 100).toFixed(0)}%` : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{m ? m.clicks.toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{m ? `${m.ctr.toFixed(2)}%` : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{m ? m.impressions.toLocaleString() : "-"}</td>
                  {isAd && (
                    <td className="px-5 py-3 text-right">
                      {ad.creative?.instagram_permalink_url && (
                        <a href={ad.creative.instagram_permalink_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td className="px-5 py-3 text-sm text-gray-700">합계</td>
                <td></td>
                {showBudget && (
                  <td className="px-4 py-3 text-right text-gray-800">총 예산 ${totals.budget.toLocaleString()}</td>
                )}
                <td className="px-4 py-3 text-right text-gray-800">${totals.spend.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-800">{totals.revenue > 0 ? `$${totals.revenue.toFixed(2)}` : "-"}</td>
                <td className={`px-4 py-3 text-right ${roasBadge(totals.spend > 0 ? totals.revenue / totals.spend : 0)}`}>
                  {totals.spend > 0 && totals.revenue > 0 ? `${((totals.revenue / totals.spend) * 100).toFixed(0)}%` : "-"}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">{totals.clicks.toLocaleString()}</td>
                <td></td>
                <td className="px-4 py-3 text-right text-gray-800">{totals.impressions.toLocaleString()}</td>
                {level === "ad" && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
        {!loading && rows.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">데이터가 없습니다.</p>
        )}
      </div>

      {/* Creative Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewAd(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm truncate">{previewAd.name}</h4>
            {previewAd.creative?.thumbnail_url && (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image src={previewAd.creative.thumbnail_url} alt={previewAd.name} fill sizes="320px" className="object-contain" />
              </div>
            )}
            {previewAd.creative?.instagram_permalink_url && (
              <a href={previewAd.creative.instagram_permalink_url} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-sm text-indigo-600 hover:underline">
                <ExternalLink size={14} /> 인스타그램에서 보기
              </a>
            )}
            <button onClick={() => setPreviewAd(null)} className="mt-3 w-full py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
