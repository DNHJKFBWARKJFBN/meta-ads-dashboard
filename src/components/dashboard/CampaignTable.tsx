"use client";

import { MetaCampaign } from "@/types/meta";

interface CampaignTableProps {
  campaigns: MetaCampaign[];
}

const statusLabel: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "활성", color: "bg-emerald-100 text-emerald-700" },
  PAUSED: { label: "일시중지", color: "bg-yellow-100 text-yellow-700" },
  ARCHIVED: { label: "보관됨", color: "bg-gray-100 text-gray-500" },
};

function getRoas(campaign: MetaCampaign) {
  const roas = campaign.insights?.data?.[0]?.purchase_roas;
  if (!roas || !roas.length) return "-";
  return `${parseFloat(roas[0].value).toFixed(2)}x`;
}

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">캠페인별 성과</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">캠페인명</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">상태</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">노출</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">클릭</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">지출</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">CTR</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const ins = c.insights?.data?.[0];
              const st = statusLabel[c.status] ?? { label: c.status, color: "bg-gray-100 text-gray-500" };
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-[220px] truncate">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{ins ? parseInt(ins.impressions).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{ins ? parseInt(ins.clicks).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{ins ? `₩${parseInt(ins.spend).toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{ins ? `${parseFloat(ins.ctr).toFixed(2)}%` : "-"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-indigo-600">{getRoas(c)}</td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">캠페인 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
