"use client";
import { motion } from "framer-motion";
import AdsSection from "@/app/components/Dashboard/sections/AdsSection";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { useDashboardUI } from "@/contexts/DashboardUIContext";

export default function AdsPage() {
  const { selectedClient: client, socialInsights, socialDemographics } = useDashboardData();
  /** @deprecated — use useDateRangeParam via DashboardHeader instead. Remove in Phase B. */
  const { timeFilter } = useDashboardUI();

  return (
    <motion.div
      key="ads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <AdsSection
        client={client}
        socialInsights={socialInsights}
        socialDemographics={socialDemographics}
        timeFilter={timeFilter}
      />
    </motion.div>
  );
}
