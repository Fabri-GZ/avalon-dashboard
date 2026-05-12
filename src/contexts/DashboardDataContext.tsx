"use client";
import { createContext, useContext, useMemo } from "react";
import { useClientData } from "@/hooks/useClientData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import type { Role } from "@/lib/permissions";

interface DashboardDataProviderProps {
  children: React.ReactNode;
  initialRole: Role;
  initialAllowedSections: string[];
  initialUserId: string;
}

const DashboardDataContext = createContext<any | null>(null);

export function DashboardDataProvider({
  children,
  initialRole,
  initialAllowedSections,
  initialUserId,
}: DashboardDataProviderProps) {
  const {
    clients,
    selectedClient,
    setSelectedClient,
    userRole,
    allowedSections,
    profile,
    loading: clientLoading,
    error: clientError,
    refetch,
  } = useClientData();

  const {
    socialInsights,
    websiteAnalytics,
    socialDemographics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalyticsData(selectedClient?.id);

  const value = useMemo(
    () => ({
      role: userRole ?? initialRole,
      allowedSections: allowedSections ?? initialAllowedSections,
      userId: initialUserId,
      clients,
      selectedClient,
      setSelectedClient,
      profile,
      userRole: userRole ?? initialRole,
      socialInsights,
      websiteAnalytics,
      socialDemographics,
      dataLoading: clientLoading || analyticsLoading,
      dataError: clientError || analyticsError,
      refetch,
    }),
    [
      userRole,
      allowedSections,
      clients,
      selectedClient,
      profile,
      socialInsights,
      websiteAnalytics,
      socialDemographics,
      clientLoading,
      analyticsLoading,
      clientError,
      analyticsError,
    ]
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
  return ctx;
}
