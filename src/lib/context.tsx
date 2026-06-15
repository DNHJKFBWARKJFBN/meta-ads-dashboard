"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { DatePreset } from "@/types/meta";

interface DashboardCtx {
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

const Ctx = createContext<DashboardCtx | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Ctx.Provider value={{ datePreset, setDatePreset, sidebarOpen, setSidebarOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be inside DashboardProvider");
  return ctx;
}
