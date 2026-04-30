"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiShield, FiAlertCircle } from "react-icons/fi";
import { useSettingsData } from "@/hooks/useSettingsData";
import { containerVariants } from "../data/dataProcessors";
import Loader from "@/app/components/Loader/loader";
import ProfileCard from "./settings/ProfileCard";
import SecurityCard from "./settings/SecurityCard";
import { cn } from "@/lib/utils";

const SettingsSection = ({ activeTab }) => {
  const {
    profile,
    loading,
    saving,
    error,
    updateProfile,
    updateEmail,
    updateAvatar,
    requestPasswordReset,
  } = useSettingsData();

  if (loading) {
    return <Loader />;
  }

  if (error && !profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <FiAlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar configuración</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <ProfileCard
              profile={profile}
              saving={saving}
              onUpdateProfile={updateProfile}
              onUpdateEmail={updateEmail}
              onUpdateAvatar={updateAvatar}
            />
          )}

          {activeTab === "security" && (
            <SecurityCard
              profile={profile}
              saving={saving}
              onRequestPasswordReset={requestPasswordReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SettingsSection;

