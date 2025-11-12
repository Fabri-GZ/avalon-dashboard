"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import OverviewSection from "./sections/OverviewSection";
import WebsiteSection from "./sections/WebsiteSection";
import AdsSection from "./sections/AdsSection";
import ChatbotSection from "./sections/ChatbotSection";
import { navigation } from "./data/mockData";

const DashboardContent = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#2b2b2b] lg:flex flex-row">
      <Sidebar 
        mobile={false} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setSidebarOpen={setSidebarOpen}
        onLogout={onLogout}
        navigation={navigation}
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
          />
        )}
      </AnimatePresence>
      
      <div className="w-full">
        <DashboardHeader 
          activeTab={activeTab} 
          setSidebarOpen={setSidebarOpen}
          navigation={navigation}
        />

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <OverviewSection />}
            {activeTab === 'website' && <WebsiteSection />}
            {activeTab === 'ads' && <AdsSection />}
            {activeTab === 'chatbot' && <ChatbotSection />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardContent;