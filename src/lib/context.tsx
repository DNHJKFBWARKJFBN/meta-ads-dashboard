"use client";
import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { DatePreset } from "@/types/meta";

interface CustomRange { since: string; until: string; }

export const DATE_LABELS: Record<DatePreset, string> = {
  today: "오늘",
  yesterday: "어제",
  last_7d: "최근 7일",
  last_14d: "최근 14일",
  last_30d: "최근 30일",
  this_month: "이번 달",
  last_month: "지난 달",
  custom: "직접 입력",
};

interface DashboardCtx {
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;
  customRange: CustomRange | null;
  setCustomRange: (r: CustomRange | null) => void;
  dateParam: string;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

const Ctx = createContext<DashboardCtx | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dateParam = useMemo(() => {
    if (datePreset === "custom" && customRange) {
      return `since=${customRange.since}&until=${customRange.until}`;
    }
    return `date_preset=${datePreset}`;
  }, [datePreset, customRange]);

  return (
    <Ctx.Provider value={{ datePreset, setDatePreset, customRange, setCustomRange, dateParam, sidebarOpen, setSidebarOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be inside DashboardProvider");
  return ctx;
}
