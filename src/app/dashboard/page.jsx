"use client";

import { useRouter } from "next/navigation";
import DashboardContent from "../components/Dashboard/DashboardContent";

export default function DashboardPage() {
  const router = useRouter();
  
  const handleLogout = () => {
    router.push("/");
  };

  return <DashboardContent onLogout={handleLogout} />;
}