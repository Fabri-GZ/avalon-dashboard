"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdLock, MdMail } from "react-icons/md";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { login } from "@/lib/auth-actions"
import SignInWithGoogleButton from "./SignInWithGoogleButton";

const Login = ({ onRegister, onForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    return email.includes("@") && email.includes(".");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let hasError = false;

    if (!validateEmail(email)) {
      setEmailError(true);
      hasError = true;
      toast.error("Por favor, ingrese una dirección de correo válida");
      setTimeout(() => setEmailError(false), 1000);
    }

    if (password.length < 6) {
      setPasswordError(true);
      hasError = true;
      toast.error("La contraseña debe tener al menos 6 caracteres");
      setTimeout(() => setPasswordError(false), 1000);
    }

    if (!hasError) {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      
      try {
        await login(formData);
      } catch (error) {
        toast.error("Error al iniciar sesión. Verifica tus credenciales.");
        setIsLoading(false);
      }
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="rounded-lg p-8 w-full max-w-md bg-[#f4f1f8] shadow-[20px_20px_60px_#cfcdd3,-20px_-20px_60px_#ffffff]"
    >
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl font-bold text-[#A047FF] mb-2"
        >
          Avalon
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-gray-700"
        >
          Dashboard de Marketing
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative mb-3"
        >
          <motion.div animate={emailError ? shakeAnimation : {}}>
            <motion.div
              animate={emailError ? { color: "#ef4444" } : { color: "#6b7280" }}
              transition={{ duration: 0.3 }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
            >
              <MdMail size={18} />
            </motion.div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 bg-[#f4f1f8] rounded-lg text-black outline-none ${
                emailError
                  ? "border-2 border-red-500"
                  : "border border-[#D4BBFC] focus:border-[#A047FF] hover:border-[#A047FF]"
              }`}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative mb-3"
        >
          <motion.div animate={passwordError ? shakeAnimation : {}}>
            <motion.div
              animate={passwordError ? { color: "#ef4444" } : { color: "#6b7280" }}
              transition={{ duration: 0.3 }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
            >
              <MdLock size={18} />
            </motion.div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 bg-[#f4f1f8] rounded-lg text-black outline-none ${
                passwordError
                  ? "border-2 border-red-500"
                  : "border border-[#D4BBFC] focus:border-[#A047FF] hover:border-[#A047FF]"
              }`}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#A047FF] z-10"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          type="button"
          onClick={onForgot}
          className="w-fit text-gray-700 text-sm text-left hover:text-[#A047FF] ease-in duration-200 pb-3"
        >
          ¿Olvidaste tu contraseña?
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#A047FF] hover:bg-[#8c3de6] text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(140, 61, 230, 0.44)" }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onRegister}
          className="w-full text-[#8c3de6] hover:text-[#f4f1f8] font-semibold py-2 rounded-lg"
        >
          Crear Cuenta
        </motion.button>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center my-4"
        >
          <hr className="grow border-t border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">o</span>
          <hr className="grow border-t border-gray-700" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <SignInWithGoogleButton /> 
        </motion.div>
      </form>
      <ToastContainer 
        position="top-right"
        autoClose={2000}
        theme="colored"
        transition={Flip}
        closeOnClick
        pauseOnHover={false}
      />
    </motion.div>
  );
};

export default Login;