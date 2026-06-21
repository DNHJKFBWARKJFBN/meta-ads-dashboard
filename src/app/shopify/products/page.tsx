"use client";

import { useEffect, useState } from "react";
import { Package, RefreshCw, AlertCircle, Menu } from "lucide-react";
import { useDashboard } from "@/lib/context";

interface Variant {
  inventory_quantity: number;
  price: string;
  sku: string;
  title: string;
}

interface Product {
  id: number;
  title: string;
  status: string;
  variants: Variant[];
  image?: { src: string };
}

export default function ShopifyProductsPage() {
  const { setSidebarOpen } = useDashboard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/shopify/products")
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setProducts(d.products ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  const totalInventory = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.inventory_quantity, 0), 0);
  const outOfStock = products.filter((p) => p.variants.every((v) => v.inventory_quantity <= 0)).length;
  const lowStock = products.filter((p) => p.variants.some((v) => v.inventory_quantity > 0 && v.inventory_quantity <= 5)).length;

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <Package size={15} className="text-violet-500" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">BEPHOR_쇼피파이 · 제품 재고</h2>
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
            { label: "총 제품 수", value: loading ? "-" : `${products.length}개`, color: "text-gray-800" },
            { label: "총 재고", value: loading ? "-" : `${totalInventory.toLocaleString()}개`, color: "text-violet-600" },
            { label: "품절 제품", value: loading ? "-" : `${outOfStock}개`, color: "text-red-500" },
            { label: "재고 부족 (5개 이하)", value: loading ? "-" : `${lowStock}개`, color: "text-orange-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700 flex-1">제품 목록</p>
            <input
              type="text"
              placeholder="제품명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
            />
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">제품 데이터가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((product) => {
                const totalQty = product.variants.reduce((s, v) => s + v.inventory_quantity, 0);
                const isOut = totalQty <= 0;
                const isLow = totalQty > 0 && totalQty <= 5;
                return (
                  <div key={product.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    {product.image ? (
                      <img src={product.image.src} alt={product.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                        <Package size={14} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.title}</p>
                      <p className="text-xs text-gray-400">{product.variants.length}개 옵션</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isOut ? "bg-red-100 text-red-600" : isLow ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {isOut ? "품절" : isLow ? "부족" : "재고있음"}
                    </span>
                    <p className="text-sm font-semibold text-gray-800 tabular-nums w-12 text-right">{totalQty}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
