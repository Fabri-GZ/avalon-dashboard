"use client";

import React from "react";
import ForgotPassword from "./components/ForgotPassword";

const ForgotPasswordPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <ForgotPassword onBack={() => window.location.href = "/login"} />
    </div>
  );
};

export default ForgotPasswordPage;