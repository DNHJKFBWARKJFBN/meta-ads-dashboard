"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, AlertCircle, Menu, MapPin } from "lucide-react";
import { useDashboard } from "@/lib/context";
import { resolveDateRange } from "@/lib/time";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  orders_count: number;
  total_spent: string;
  default_address?: {
    city: string;
    province: string;
    country: string;
    country_code: string;
  };
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ShopifyCustomersPage() {
  const { datePreset, customRange, setSidebarOpen } = useDashboard();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  const resolved = resolveDateRange(datePreset, customRange);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (resolved) { qs.set("since", resolved.since); qs.set("until", resolved.until); }
    fetch(`/api/shopify/customers?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setCustomers(d.customers ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolved?.since, resolved?.until, refreshKey]);

  const filtered = dayFilter !== null
    ? customers.filter((c) => new Date(c.created_at).getDay() === dayFilter)
    : customers;

  const returning = filtered.filter((c) => c.orders_count > 1).length;
  const totalSpent = filtered.reduce((s, c) => s + parseFloat(c.total_spent || "0"), 0);

  const dayCount: Record<number, number> = {};
  customers.forEach((c) => {
    const d = new Date(c.created_at).getDay();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const maxDay = Math.max(...Object.values(dayCount), 1);

  // 국가별 분포
  const countryMap: Record<string, number> = {};
  filtered.forEach((c) => {
    const country = c.default_address?.country || "알 수 없음";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalCountry = topCountries.reduce((s, [, v]) => s + v, 0);

  // 주/도시별 분포 (상위 국가 내)
  const cityMap: Record<string, number> = {};
  filtered.forEach((c) => {
    const loc = c.default_address
      ? `${c.default_address.city || ""} ${c.default_address.province || ""}`.trim() || c.default_address.country
      : null;
    if (loc) cityMap[loc] = (cityMap[loc] || 0) + 1;
  });
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalCity = topCities.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <Users size={15} className="text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">BEPHOR_쇼피파이 · 고객</h2>
        <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </header>

      <main className="p-5 md:p-6 space-y-5">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "신규 고객", value: loading ? "-" : `${filtered.length.toLocaleString()}명`, color: "text-blue-600" },
            { label: "재구매 고객", value: loading ? "-" : `${returning}명`, color: "text-indigo-600" },
            { label: "총 구매금액", value: loading ? "-" : `$${totalSpent.toFixed(2)}`, color: "text-emerald-600" },
            { label: "평균 구매금액", value: loading ? "-" : filtered.length > 0 ? `$${(totalSpent / filtered.length).toFixed(2)}` : "$0.00", color: "text-gray-800" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* 요일별 신규 고객 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-4">요일별 신규 고객 가입</p>
          <div className="flex gap-2 items-end h-20">
            {DAY_LABELS.map((label, i) => {
              const count = dayCount[i] || 0;
              const pct = (count / maxDay) * 100;
              const active = dayFilter === i;
              return (
                <button key={i} onClick={() => setDayFilter(active ? null : i)} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct * 0.6, 4)}px`, background: active ? "#3b82f6" : "#dbeafe" }} />
                  <span className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
          {dayFilter !== null && (
            <p className="text-xs text-blue-500 mt-2 text-center">{DAY_LABELS[dayFilter]}요일 필터 적용 중 · 클릭해서 해제</p>
          )}
        </div>

        {/* 지역 분포 */}
        {!loading && (topCountries.length > 0 || topCities.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 국가별 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={13} className="text-blue-400" />
                <p className="text-xs font-semibold text-gray-500">국가별 고객 분포</p>
              </div>
              <div className="space-y-2.5">
                {topCountries.map(([country, count]) => {
                  const pct = totalCountry > 0 ? (count / totalCountry) * 100 : 0;
                  return (
                    <div key={country} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{country}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
                      <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{count}명</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 도시/주별 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={13} className="text-indigo-400" />
                <p className="text-xs font-semibold text-gray-500">도시/주별 고객 분포 (상위 10)</p>
              </div>
              <div className="space-y-2.5">
                {topCities.map(([city, count]) => {
                  const pct = totalCity > 0 ? (count / totalCity) * 100 : 0;
                  return (
                    <div key={city} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{city}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
                      <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{count}명</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 고객 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">고객 목록 ({filtered.length}명)</p>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">고객 데이터가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <div key={customer.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-blue-600">{customer.first_name?.[0] ?? "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{customer.first_name} {customer.last_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {customer.email} · {new Date(customer.created_at).toLocaleDateString("ko-KR")} ({DAY_LABELS[new Date(customer.created_at).getDay()]}요일)
                      {customer.default_address && ` · ${customer.default_address.city || customer.default_address.country}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${customer.orders_count > 1 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                    {customer.orders_count > 1 ? "재구매" : "신규"}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">${parseFloat(customer.total_spent || "0").toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
