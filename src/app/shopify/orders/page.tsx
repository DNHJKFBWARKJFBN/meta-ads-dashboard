"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, RefreshCw, AlertCircle, Menu, X, MapPin, User, Tag, Package } from "lucide-react";
import { useDashboard } from "@/lib/context";
import { resolveDateRange } from "@/lib/time";

interface LineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  variant_title: string | null;
}

interface Order {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  total_shipping_price_set?: { shop_money: { amount: string } };
  currency: string;
  source_name: string | null;
  referring_site: string | null;
  landing_site: string | null;
  landing_site_ref: string | null;
  note: string | null;
  tags: string;
  line_items: LineItem[];
  customer?: { first_name: string; last_name: string; email: string; orders_count: number; total_spent: string };
  shipping_address?: { address1: string; city: string; province: string; country: string; zip: string; phone: string };
  discount_codes?: { code: string; amount: string }[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABEL: Record<string, string> = {
  paid: "결제완료", pending: "대기중", refunded: "환불", voided: "취소",
  partially_refunded: "부분환불", authorized: "승인됨",
};
const STATUS_COLOR: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700", pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-red-100 text-red-700", voided: "bg-gray-100 text-gray-500",
  partially_refunded: "bg-orange-100 text-orange-700", authorized: "bg-blue-100 text-blue-700",
};
const FULFILL_LABEL: Record<string, string> = {
  fulfilled: "배송완료", partial: "부분배송", null: "미배송",
};

const CHANNEL_COLOR: Record<string, string> = {
  tiktok: "bg-black text-white", facebook: "bg-blue-600 text-white",
  instagram: "bg-pink-500 text-white", google: "bg-green-600 text-white",
  web: "bg-gray-100 text-gray-600",
};

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const shipping = parseFloat(order.total_shipping_price_set?.shop_money?.amount ?? "0");
  const discounts = parseFloat(order.total_discounts || "0");
  const src = order.source_name?.toLowerCase() ?? "web";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">{order.name}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.financial_status] ?? "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABEL[order.financial_status] ?? order.financial_status}
          </span>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 주문 상품 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">주문 상품</p>
            <div className="space-y-3">
              {order.line_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={13} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      {item.variant_title && `${item.variant_title} · `}
                      {item.sku && `SKU: ${item.sku}`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 shrink-0">{item.quantity}개</p>
                  <p className="text-sm font-semibold text-gray-700 shrink-0">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 결제 내역 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">결제 내역</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>소계</span>
                <span>${parseFloat(order.subtotal_price || "0").toFixed(2)}</span>
              </div>
              {discounts > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>할인 {order.discount_codes?.map((d) => d.code).join(", ")}</span>
                  <span>-${discounts.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>배송</span>
                <span>{shipping === 0 ? "무료" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2 mt-2">
                <span>총액</span>
                <span>${parseFloat(order.total_price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 전환 요약 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">전환 요약</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">유입 채널</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${CHANNEL_COLOR[src] ?? "bg-gray-100 text-gray-600"}`}>
                  {order.source_name || "Direct"}
                </span>
              </div>
              {order.referring_site && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">유입 URL</span>
                  <span className="text-xs text-gray-600 break-all">{order.referring_site}</span>
                </div>
              )}
              {order.landing_site && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">랜딩 페이지</span>
                  <span className="text-xs text-gray-600 break-all">{order.landing_site}</span>
                </div>
              )}
              {!order.referring_site && !order.landing_site && (
                <p className="text-xs text-gray-400">전환 경로 정보 없음</p>
              )}
            </div>
          </div>

          {/* 고객 정보 */}
          {order.customer && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">고객</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{order.customer.first_name} {order.customer.last_name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${order.customer.orders_count > 1 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                    {order.customer.orders_count > 1 ? "재구매" : "신규"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{order.customer.email}</p>
                <p className="text-xs text-gray-400">총 구매: ${parseFloat(order.customer.total_spent || "0").toFixed(2)} ({order.customer.orders_count}건)</p>
              </div>
            </div>
          )}

          {/* 배송 주소 */}
          {order.shipping_address && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">배송 주소</p>
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-4">
                <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>{order.shipping_address.address1}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}</p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && <p className="text-xs text-gray-400">{order.shipping_address.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* 배송 상태 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">배송 상태</p>
              <p className="text-sm font-medium text-gray-700">
                {FULFILL_LABEL[order.fulfillment_status ?? "null"] ?? order.fulfillment_status ?? "미배송"}
              </p>
            </div>
            {order.tags && (
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Tag size={10} /> 태그</p>
                <p className="text-xs text-gray-600 truncate">{order.tags}</p>
              </div>
            )}
          </div>

          {/* 메모 */}
          {order.note && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-700 mb-1">메모</p>
              <p className="text-xs text-yellow-800">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopifyOrdersPage() {
  const { datePreset, customRange, setSidebarOpen } = useDashboard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const resolved = resolveDateRange(datePreset, customRange);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (resolved) { qs.set("since", resolved.since); qs.set("until", resolved.until); }
    fetch(`/api/shopify/orders?${qs}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setOrders(d.orders ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolved?.since, resolved?.until, refreshKey]);

  const filtered = dayFilter !== null
    ? orders.filter((o) => new Date(o.created_at).getDay() === dayFilter)
    : orders;

  const totalRevenue = filtered.reduce((s, o) => s + parseFloat(o.total_price), 0);

  const dayCount: Record<number, number> = {};
  orders.forEach((o) => {
    const d = new Date(o.created_at).getDay();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const maxDay = Math.max(...Object.values(dayCount), 1);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <ShoppingCart size={15} className="text-emerald-500" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">BEPHOR_쇼피파이 · 주문</h2>
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
            { label: "총 주문", value: loading ? "-" : `${filtered.length.toLocaleString()}건` },
            { label: "총 매출", value: loading ? "-" : `$${totalRevenue.toFixed(2)}` },
            { label: "평균 주문금액", value: loading ? "-" : filtered.length > 0 ? `$${(totalRevenue / filtered.length).toFixed(2)}` : "$0.00" },
            { label: "결제 완료", value: loading ? "-" : `${filtered.filter((o) => o.financial_status === "paid").length}건` },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-800">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* 요일별 분포 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-4">요일별 주문 수</p>
          <div className="flex gap-2 items-end h-20">
            {DAY_LABELS.map((label, i) => {
              const count = dayCount[i] || 0;
              const pct = (count / maxDay) * 100;
              const active = dayFilter === i;
              return (
                <button key={i} onClick={() => setDayFilter(active ? null : i)}
                  className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct * 0.6, 4)}px`, background: active ? "#6366f1" : "#e0e7ff" }} />
                  <span className={`text-[11px] font-medium ${active ? "text-indigo-600" : "text-gray-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
          {dayFilter !== null && (
            <p className="text-xs text-indigo-500 mt-2 text-center">
              {DAY_LABELS[dayFilter]}요일 필터 적용 중 · 클릭해서 해제
            </p>
          )}
        </div>

        {/* 주문 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">주문 목록 ({filtered.length}건)</p>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">주문 데이터가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{order.name}</p>
                    <p className="text-xs text-gray-400">
                      {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : "비회원"} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("ko-KR")} ({DAY_LABELS[new Date(order.created_at).getDay()]}요일)
                      {order.source_name && ` · ${order.source_name}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.financial_status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[order.financial_status] ?? order.financial_status}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums shrink-0">${parseFloat(order.total_price).toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
