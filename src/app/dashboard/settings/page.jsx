"use client";
import { motion } from "framer-motion";
import SettingsSection from "@/app/components/Dashboard/sections/SettingsSection";

export default function SettingsPage() {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <SettingsSection />
    </motion.div>
  );
}
