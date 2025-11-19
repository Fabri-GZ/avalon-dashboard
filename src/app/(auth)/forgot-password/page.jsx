"use client";
import React from 'react';
import ForgotPasswordForm from './components/ForgotPassword';

const ForgotPassword = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f1f8]">
      <ForgotPasswordForm
        onBack={() => window.location.href = "/login"}
      />
    </div>
  );
};

export default ForgotPassword;
