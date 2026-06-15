"use client";

import { useDashboard } from "@/lib/context";
import { DatePreset } from "@/types/meta";
import { BarChart2, X, ChevronDown } from "lucide-react";
import { useState } from "react";

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "yesterday", label: "어제" },
  { value: "last_7d", label: "최근 7일" },
  { value: "last_14d", label: "최근 14일" },
  { value: "last_30d", label: "최근 30일" },
  { value: "this_month", label: "이번 달" },
  { value: "last_month", label: "지난 달" },
];

function DateDropdown() {
  const { datePreset, setDatePreset } = useDashboard();
  const [open, setOpen] = useState(false);
  const label = DATE_OPTIONS.find((o) => o.value === datePreset)?.label ?? "기간 선택";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
      >
        <span>{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-[#1e2235] border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDatePreset(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                datePreset === opt.value ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useDashboard();

  const inner = (
    <div className="flex flex-col h-full bg-[#141726] w-[260px]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">ES_ADS BOARD</span>
        </div>
      </div>

      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">연결 계정</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-white text-sm font-medium">Bephor</span>
        </div>
      </div>

      {/* Date */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">기간</p>
        <DateDropdown />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="px-3 py-2 text-white bg-indigo-600 rounded-lg flex items-center gap-2 text-sm font-medium">
          <BarChart2 size={15} />
          대시보드
        </div>
      </nav>

      <div className="px-5 py-4 text-xs text-gray-600">
        Meta Marketing API v21.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex shrink-0">{inner}</aside>

      {/* Mobile Overlay */}
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
