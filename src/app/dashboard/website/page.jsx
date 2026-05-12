"use client";
import { motion } from "framer-motion";
import WebsiteSection from "@/app/components/Dashboard/sections/WebsiteSection";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { useDashboardUI } from "@/contexts/DashboardUIContext";

export default function WebsitePage() {
  const { selectedClient: client, websiteAnalytics } = useDashboardData();
  const { timeFilter } = useDashboardUI();

  return (
    <motion.div
      key="website"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <WebsiteSection
        client={client}
        websiteAnalytics={websiteAnalytics}
        timeFilter={timeFilter}
      />
    </motion.div>
  );
}
