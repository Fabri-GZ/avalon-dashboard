"use client";

import { motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";
import { useAccountData } from "@/hooks/useAccountData";
import { containerVariants } from "../data/dataProcessors";
import Loader from "@/app/components/Loader/loader";

import CompanyProfileCard from "./account/CompanyProfileCard";
import CredentialsCard from "./account/CredentialsCard";
import WebsiteCard from "./account/WebsiteCard";
import ReportsCard from "./account/ReportsCard";
import DriveCard from "./account/DriveCard";
import AccountStatusCard from "./account/AccountStatusCard";

const AccountSection = ({ client, userRole }) => {
  const {
    clientProfile,
    credentials,
    reports,
    driveResource,
    websiteResource,
    loading,
    error,
    isUpdatingStatus,
    requestOffboarding
  } = useAccountData(client?.clientId ?? null);

  const isAdmin = userRole === 'admin_global';

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <FiAlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar datos de la cuenta</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </motion.div>
    );
  }

  const hasSecondaryResources = (reports && reports.length > 0) || driveResource;

  return (
    <motion.div
      key="account"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <CompanyProfileCard profile={clientProfile} />

      {(credentials.length > 0 || websiteResource) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CredentialsCard credentials={credentials} />
          </div>
          <div className="lg:col-span-1">
            <WebsiteCard websiteResource={websiteResource} />
          </div>
        </div>
      )}

      {hasSecondaryResources && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReportsCard reports={reports} />
          <DriveCard driveResource={driveResource} />
        </div>
      )}

      <AccountStatusCard
        status={clientProfile?.status}
        isAdmin={isAdmin}
        onRequestOffboarding={requestOffboarding}
        isUpdating={isUpdatingStatus}
      />
    </motion.div>
  );
};

export default AccountSection;
