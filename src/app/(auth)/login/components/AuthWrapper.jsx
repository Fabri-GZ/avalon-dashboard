"use client"

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Login from "./Login";
import Register from "../../signup/components/Register";
import ForgotPassword from "../../forgot-password/components/ForgotPassword"
    
const AuthWrapper = ({ onLogin }) => {
  const [view, setView] = useState("login");

  const changeView = (next) => setView(next);
  
     return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0e0e0] p-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div
            key="login"
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Login onRegister={() => changeView("register")} onForgot={() => changeView("forgot")} onLogin={onLogin} />
          </motion.div>
        )}

        {view === "register" && (
          <motion.div
            key="register"
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Register onBack={() => changeView("login")} />
          </motion.div>
        )}

        {view === "forgot" && (
          <motion.div
            key="forgot"
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <ForgotPassword onBack={() => changeView("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthWrapper;