"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import OverviewSection from "./sections/OverviewSection";
import WebsiteSection from "./sections/WebsiteSection";
import AdsSection from "./sections/AdsSection";
import ChatbotSection from "./sections/ChatbotSection";
import AccountSection from "./sections/AccountSection";
import { navigation } from "./data/dataProcessors";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClientData } from "@/hooks/useClientData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

const DashboardContent = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('monthly');
  const { profile } = useUserProfile();

   const {
    clients,
    selectedClient,
    setSelectedClient,
    userRole,
    loading: clientLoading,
    error: clientError
  } = useClientData();

  const {
    socialInsights,
    websiteAnalytics,
    socialDemographics,
    loading: analyticsLoading,
    error: analyticsError,
    refetch
  } = useAnalyticsData(selectedClient?.id);

  const loading = clientLoading || analyticsLoading;
  const error = clientError || analyticsError;

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) setSelectedClient(client);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        
        <div className="relative w-24 h-24 rounded-full border-4 border-primary/20">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error al cargar datos
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No se encontró información del cliente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary lg:flex flex-row">
      <Sidebar
        mobile={false} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setSidebarOpen={setSidebarOpen}
        onLogout={onLogout}
        navigation={navigation}
        profile={profile}
        userRole={userRole}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={handleClientChange}
      />
      
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar 
            mobile={true} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            setSidebarOpen={setSidebarOpen}
            onLogout={onLogout}
            navigation={navigation}
            profile={profile}
            userRole={userRole}
            clients={clients}
            selectedClient={selectedClient}
            onClientChange={handleClientChange}
          />
        )}
      </AnimatePresence>
      
      <div className="w-full">
        <DashboardHeader 
          activeTab={activeTab} 
          setSidebarOpen={setSidebarOpen}
          navigation={navigation}
          onRefresh={refetch}
          userRole={userRole}
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
        />

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewSection
                client={selectedClient}
                socialInsights={socialInsights}
                websiteAnalytics={websiteAnalytics}
                socialDemographics={socialDemographics}
                timeFilter={timeFilter}
              />
            )}

            {activeTab === 'website' && (
              <WebsiteSection
                client={selectedClient}
                websiteAnalytics={websiteAnalytics}
                timeFilter={timeFilter}
              />
            )}

            {activeTab === 'ads' && (
              <AdsSection
                client={selectedClient}
                socialInsights={socialInsights}
                socialDemographics={socialDemographics}
                timeFilter={timeFilter}
              />
            )}

            {activeTab === 'chatbot' && (
              <ChatbotSection
                client={selectedClient}
              />
            )}

            {activeTab === 'account' && (
              <AccountSection
                client={selectedClient}
                userRole={userRole}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardContent;