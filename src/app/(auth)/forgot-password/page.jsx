"use client";

import React from "react";
import ForgotPassword from "./components/ForgotPassword";

const ForgotPasswordPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f1f8]">
      <ForgotPassword onBack={() => window.location.href = "/login"} />
    </div>
  );
};

export default ForgotPasswordPage;