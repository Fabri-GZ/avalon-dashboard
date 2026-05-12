"use client";
import { motion } from "framer-motion";
import AccountSection from "@/app/components/Dashboard/sections/AccountSection";
import { useDashboardData } from "@/contexts/DashboardDataContext";

export default function AccountPage() {
  const { selectedClient: client, userRole } = useDashboardData();

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <AccountSection client={client} userRole={userRole} />
    </motion.div>
  );
}
