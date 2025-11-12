"use client";

import { useRouter } from "next/navigation";
import AuthWrapper from "./components/Login/AuthWrapper";

export default function Home() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push("/dashboard"); 
  };

  return <AuthWrapper onLogin={handleLogin} />;
}