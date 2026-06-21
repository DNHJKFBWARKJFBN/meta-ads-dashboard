"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { useDashboard } from "@/lib/context";
import { CHANGELOG } from "@/lib/changelog";

function formatChangelogDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${String(y).slice(2)}.${m}.${d}`;
}

export default function AnnouncementsPage() {
  const { setSidebarOpen } = useDashboard();
  const [openDate, setOpenDate] = useState<string | null>(null);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F6FA] overflow-y-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-gray-700">공지사항</h2>
          <p className="text-xs text-gray-400">대시보드 업데이트 내역</p>
        </div>
      </header>

      <main className="p-5 md:p-6 max-w-2xl space-y-2">
        {CHANGELOG.map((entry) => {
          const isOpen = openDate === entry.date;
          return (
            <div key={entry.date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenDate(isOpen ? null : entry.date)}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Bell size={14} className="text-indigo-500" />
                  {formatChangelogDate(entry.date)} 업데이트
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {entry.items.map((item, i) => (
                    <div key={i} className="px-5 py-2.5 text-sm text-gray-600 flex gap-2">
                      <span className="text-indigo-400 shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {CHANGELOG.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">아직 공지사항이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
