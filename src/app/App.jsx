"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthWrapper from "./components/Login/AuthWrapper";
import Dashboard from "./components/Dashboard/DashboardContent";

const App = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <AuthWrapper onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={() => router.push("/")} />
      )}
    </div>
  );
};

export default App;
