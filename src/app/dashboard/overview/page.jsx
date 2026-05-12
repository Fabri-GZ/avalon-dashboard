"use client";
import { motion } from "framer-motion";
import OverviewSection from "@/app/components/Dashboard/sections/OverviewSection";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { useDashboardUI } from "@/contexts/DashboardUIContext";

export default function OverviewPage() {
  const { selectedClient: client, socialInsights, websiteAnalytics, socialDemographics } = useDashboardData();
  const { timeFilter } = useDashboardUI();

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <OverviewSection
        client={client}
        socialInsights={socialInsights}
        websiteAnalytics={websiteAnalytics}
        socialDemographics={socialDemographics}
        timeFilter={timeFilter}
      />
    </motion.div>
  );
}
