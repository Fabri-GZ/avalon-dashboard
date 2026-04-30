"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import DashboardHeader from "@/app/components/Dashboard/DashboardHeader";
import SettingsSection from "@/app/components/Dashboard/sections/SettingsSection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClientData } from "@/hooks/useClientData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { navigation } from "@/app/components/Dashboard/data/dataProcessors";
import { useRouter } from "next/navigation";

import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSettingTab, setActiveSettingTab] = useState("profile");
  const { profile } = useUserProfile();
  
  const {
    clients,
    selectedClient,
    setSelectedClient,
    userRole,
    loading: clientLoading,
  } = useClientData();

  const { refetch } = useAnalyticsData(selectedClient?.id);

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) setSelectedClient(client);
    router.push("/dashboard"); 
  };

  const handleLogout = async () => {
    const { createClient } = await import("@/app/utils/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-secondary lg:flex flex-row">
      <Sidebar
        variant="settings"
        mobile={false} 
        activeTab={activeSettingTab} 
        setActiveTab={setActiveSettingTab} 
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        navigation={navigation}
        profile={profile}
        userRole={userRole}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={handleClientChange}
      />
      
      <div className="flex-1 min-w-0">
        <DashboardHeader 
          title="Configuración"
          activeTab={activeSettingTab} 
          setSidebarOpen={setSidebarOpen}
          navigation={navigation}
          onRefresh={refetch}
          userRole={userRole}
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
        />

        <main className="p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <SettingsSection activeTab={activeSettingTab} />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <Sidebar
        variant="settings"
        mobile={true} 
        activeTab={activeSettingTab} 
        setActiveTab={setActiveSettingTab} 
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        navigation={navigation}
        profile={profile}
        userRole={userRole}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={handleClientChange}
      />
    </div>
  );
}
