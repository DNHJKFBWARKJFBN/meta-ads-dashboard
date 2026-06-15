"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";
import { MetaAd, insightToMetrics } from "@/types/meta";

function roasBadge(roas: number) {
  if (roas >= 3) return "bg-emerald-100 text-emerald-700";
  if (roas >= 1) return "bg-indigo-100 text-indigo-700";
  return "bg-red-100 text-red-600";
}

export default function TopCreatives() {
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Star size={15} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-700">전일 효율 상위 소재</h3>
        <span className="ml-auto text-xs text-gray-400">어제 기준 ROAS 순</span>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-5 gap-3">
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
                <div key={ad.id} className="relative group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    {ad.creative?.thumbnail_url ? (
                      <Image src={ad.creative.thumbnail_url} alt={ad.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">소재 없음</div>
                    )}
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</div>
                    {ad.creative?.instagram_permalink_url && (
                      <a href={ad.creative.instagram_permalink_url} target="_blank" rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-600 truncate" title={ad.name}>{ad.name}</p>
                  {m && (
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roasBadge(m.roas)}`}>
                      ROAS {m.roas > 0 ? m.roas.toFixed(2) : "-"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
