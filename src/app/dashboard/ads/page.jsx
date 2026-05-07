"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import DashboardContent from "@/app/components/Dashboard/DashboardContent";

export default function AdsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return <DashboardContent onLogout={handleLogout} initialTab="ads" />;
}
