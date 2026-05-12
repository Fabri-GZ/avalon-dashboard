"use client";
import { createContext, useContext, useState, useMemo } from "react";
import { usePathname } from "next/navigation";

type TimeFilter = "daily" | "monthly" | "annual";

interface DashboardUIContextValue {
  timeFilter: TimeFilter;
  setTimeFilter: (f: TimeFilter) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSection: string;
}

const DashboardUIContext = createContext<DashboardUIContextValue | null>(null);

export function DashboardUIProvider({ children }: { children: React.ReactNode }) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  // e.g. /dashboard/overview → "overview"
  const activeSection = pathname.split("/").pop() ?? "overview";

  const value = useMemo(
    () => ({ timeFilter, setTimeFilter, sidebarOpen, setSidebarOpen, activeSection }),
    [timeFilter, sidebarOpen, activeSection]
  );

  return (
    <DashboardUIContext.Provider value={value}>
      {children}
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUI() {
  const ctx = useContext(DashboardUIContext);
  if (!ctx) throw new Error("useDashboardUI must be used within DashboardUIProvider");
  return ctx;
}
