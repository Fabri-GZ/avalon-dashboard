"use client";

import React from "react";
import Login from "./components/Login";

const LoginPage = () => {
    return (   
    <div className="flex items-center justify-center min-h-screen bg-[#f4f1f8]">
      <Login
        onRegister={() => window.location.href = "/signup"}
        onForgot={() => window.location.href = "/forgot-password"}
      />
    </div>
  )
}

export default LoginPage;
