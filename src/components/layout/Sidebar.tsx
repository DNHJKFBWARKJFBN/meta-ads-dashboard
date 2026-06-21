"use client";

import { useDashboard, DATE_LABELS } from "@/lib/context";
import { DatePreset } from "@/types/meta";
import { BarChart2, X, ChevronDown, CalendarDays, FileText, Megaphone, ClipboardList, Clock, Settings, Package, Music2, MessageCircle, Bell, ShoppingBag, ShoppingCart, TrendingUp, Users, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatClockDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function isDaytime(date: Date, timeZone: string): boolean {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date));
  return hour >= 6 && hour < 18;
}

function ClockCard({
  now,
  timeZone,
  flag,
  label,
  gradient,
}: {
  now: Date | null;
  timeZone: string;
  flag: string;
  label: string;
  gradient: string;
}) {
  const daytime = now ? isDaytime(now, timeZone) : true;
  return (
    <div className={`relative overflow-hidden rounded-xl px-3 py-2.5 ${gradient}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80 tracking-wide">
          <span>{flag}</span>
          {label}
        </span>
        <span className="text-[10px]">{daytime ? "☀️" : "🌙"}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-white font-mono font-semibold text-base tabular-nums tracking-tight">
          {now ? formatClock(now, timeZone) : "--:--:--"}
        </span>
      </div>
      <div className="text-[10px] text-white/60 mt-0.5">{now ? formatClockDate(now, timeZone) : ""}</div>
    </div>
  );
}

function LiveClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="px-4 py-3 border-t border-white/10 grid grid-cols-2 gap-2">
      <ClockCard
        now={now}
        timeZone="America/Los_Angeles"
        flag="🇺🇸"
        label="PST"
        gradient="bg-gradient-to-br from-indigo-500/30 to-indigo-900/30 ring-1 ring-inset ring-indigo-400/20"
      />
      <ClockCard
        now={now}
        timeZone="Asia/Seoul"
        flag="🇰🇷"
        label="KST"
        gradient="bg-gradient-to-br from-rose-500/30 to-rose-900/30 ring-1 ring-inset ring-rose-400/20"
      />
    </div>
  );
}

const DATE_OPTIONS: { value: DatePreset; label: string }[] = (
  Object.keys(DATE_LABELS) as DatePreset[]
).map((value) => ({ value, label: DATE_LABELS[value] }));

function DateDropdown() {
  const { datePreset, setDatePreset, customRange, setCustomRange } = useDashboard();
  const [open, setOpen] = useState(false);
  const [since, setSince] = useState(customRange?.since ?? "");
  const [until, setUntil] = useState(customRange?.until ?? "");

  const label = datePreset === "custom" && customRange
    ? `${customRange.since} ~ ${customRange.until}`
    : DATE_OPTIONS.find((o) => o.value === datePreset)?.label ?? "기간 선택";

  function applyCustom() {
    if (since && until) {
      setCustomRange({ since, until });
      setDatePreset("custom");
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className={`ml-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-[#1e2235] border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value !== "custom") {
                  setDatePreset(opt.value);
                  setCustomRange(null);
                  setOpen(false);
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                datePreset === opt.value ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {opt.value === "custom" && <CalendarDays size={13} />}
              {opt.label}
            </button>
          ))}
          <div className="px-3 py-3 border-t border-white/10 space-y-2">
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="w-full px-2 py-1.5 rounded-md bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:border-indigo-400"
            />
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="w-full px-2 py-1.5 rounded-md bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={applyCustom}
              disabled={!since || !until}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs rounded-md transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoonItem({ icon: Icon, label }: { icon: typeof Megaphone; label: string }) {
  return (
    <div className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-500 cursor-default opacity-70">
      <Icon size={15} />
      <span className="flex-1 truncate">{label}</span>
      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400 whitespace-nowrap">
        <MessageCircle size={10} />
        개발 예정
      </span>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  const pathname = usePathname();
  const [shopifyOpen, setShopifyOpen] = useState(pathname.startsWith("/shopify"));

  const inner = (
    <div className="flex flex-col h-full bg-[#141726] w-[260px]">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">ES_ADS BOARD</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">연결 계정</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-white text-sm font-medium">Bephor</span>
        </div>
      </div>

      {(pathname === "/meta-bephor" || pathname === "/daily-report" || pathname.startsWith("/shopify")) && (
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">기간</p>
          <DateDropdown />
        </div>
      )}

      <nav className="flex-1 px-4 py-4 space-y-1">
        {/* 리포트 */}
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <BarChart2 size={15} />
          전체 성과
        </Link>
        <Link
          href="/daily-report"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/daily-report" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <FileText size={15} />
          일일 리포트
        </Link>

        {/* 광고 계정 */}
        <p className="px-3 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">광고 계정</p>
        <Link
          href="/meta-bephor"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/meta-bephor" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Megaphone size={15} />
          메타_BEPHOR_자사몰
        </Link>
        <ComingSoonItem icon={Music2} label="BEPHOR_틱톡" />

        {/* 쇼핑몰 */}
        <p className="px-3 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">쇼핑몰</p>
        <button
          onClick={() => setShopifyOpen((v) => !v)}
          className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/shopify") ? "text-white bg-emerald-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ShoppingBag size={15} />
          <span className="flex-1 text-left">BEPHOR_쇼피파이</span>
          <ChevronDown size={13} className={`transition-transform duration-200 ${shopifyOpen ? "rotate-180" : ""}`} />
        </button>
        {shopifyOpen && (
          <div className="ml-4 space-y-0.5 border-l border-white/10 pl-3">
            {[
              { href: "/shopify/orders", label: "주문", icon: ShoppingCart },
              { href: "/shopify/revenue", label: "매출", icon: TrendingUp },
              { href: "/shopify/products", label: "제품 재고", icon: Package },
              { href: "/shopify/customers", label: "고객", icon: Users },
              { href: "/shopify/marketing", label: "마케팅", icon: Radio },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname === href ? "text-white bg-emerald-600/80" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </div>
        )}
        <ComingSoonItem icon={Package} label="BEPHOR_아마존" />

        {/* 업무 진행 상황 */}
        <p className="px-3 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">업무 진행 상황</p>
        <Link
          href="/work-progress/daily"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/work-progress/daily" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ClipboardList size={15} />
          브랜드 일일 업무 진행표
        </Link>
        <Link
          href="/work-progress/attendance"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/work-progress/attendance" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Clock size={15} />
          브랜드 출퇴근 기록표
        </Link>
        <Link
          href="/work-progress/settings"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            pathname === "/work-progress/settings" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Settings size={15} />
          시트 설정
        </Link>

        <Link
          href="/announcements"
          onClick={() => setSidebarOpen(false)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors mt-5 ${
            pathname === "/announcements" ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Bell size={15} />
          공지사항
        </Link>
      </nav>

      <LiveClocks />

      <div className="px-5 py-3 text-xs text-gray-600">
        ES_ADS BOARD v1.0
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex shrink-0">{inner}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex">
            {inner}
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-[-40px] text-white">
              <X size={22} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
