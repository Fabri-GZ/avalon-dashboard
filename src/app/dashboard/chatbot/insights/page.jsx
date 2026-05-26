"use client";
import { motion } from "framer-motion";
import ChatbotSection from "@/app/components/Dashboard/sections/ChatbotSection";
import { useDashboardData } from "@/contexts/DashboardDataContext";

export default function ChatbotInsightsPage() {
  const { selectedClient: client } = useDashboardData();

  return (
    <motion.div
      key="chatbot-insights"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <ChatbotSection client={client} />
    </motion.div>
  );
}
