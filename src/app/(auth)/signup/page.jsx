"use client";
import React from 'react';
import Register from './components/Register';

const SignUpPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f1f8]">
      <Register
        onBack={() => window.location.href = "/login"}
        onLogin={() => window.location.href = "/login"}
      />
    </div>
  );
};

export default SignUpPage;
