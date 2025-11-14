"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdLock, MdMail } from "react-icons/md";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = ({ onRegister, onForgot, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateEmail = (email) => {
    return email.includes("@") && email.includes(".");
  };

  const handleSubmit = (e) => {
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
      onLogin();
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  return (
    <div className="rounded-lg p-8 w-full max-w-md bg-[#f4f1f8] shadow-[20px_20px_60px_#cfcdd3,-20px_-20px_60px_#ffffff]">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-[#A047FF] mb-2">Avalon</h1>
        <p className="text-gray-700">Dashboard de Marketing</p>
      </div>

      <div className="space-y-4">
        <motion.div
          className="relative mb-3"
          animate={emailError ? shakeAnimation : {}}
        >
          <motion.div
            animate={emailError ? { color: "#ef4444" } : { color: "#6b7280" }}
            transition={{ duration: 0.3 }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
          >
            <MdMail size={18} />
          </motion.div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={`w-full pl-10 pr-4 py-3 bg-[#f4f1f8] rounded-lg text-black outline-none transition-colors duration-300 ease-in ${
              emailError
                ? "border-2 border-red-500"
                : "border border-[#D4BBFC] focus:border-[#A047FF] hover:border-[#A047FF]"
            }`}
          />
        </motion.div>

        <motion.div
          className="relative mb-3"
          animate={passwordError ? shakeAnimation : {}}
        >
          <motion.div
            animate={passwordError ? { color: "#ef4444" } : { color: "#6b7280" }}
            transition={{ duration: 0.3 }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
          >
            <MdLock size={18} />
          </motion.div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className={`w-full pl-10 pr-4 py-3 bg-[#f4f1f8] rounded-lg text-black outline-none transition-colors duration-300 ease-in ${
              passwordError
                ? "border-2 border-red-500"
                : "border border-[#D4BBFC] focus:border-[#A047FF] hover:border-[#A047FF]"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#A047FF] transition-colors"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </motion.div>

        <button
          type="button"
          onClick={onForgot}
          className="w-fit text-gray-700 text-sm text-left hover:text-[#A047FF] pb-3 transition-colors ease-in"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#A047FF] hover:bg-[#8c3de6] text-white font-semibold py-3 rounded-lg transition-colors duration-300 ease-in"
        >
          Iniciar sesión
        </button>

        <button
          type="button"
          onClick={onRegister}
          className="w-full text-[#8c3de6] hover:bg-[#8c3de671] hover:text-[#f4f1f8] font-semibold py-2 rounded-lg transition-all duration-200 ease-in"
        >
          Crear Cuenta
        </button>

        <div className="flex items-center my-4">
          <hr className="grow border-t border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">o</span>
          <hr className="grow border-t border-gray-700" />
        </div>

        <button
          type="button"
          onClick={() => console.log("Google login")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200 ease-in"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Iniciar sesión con Google
        </button>
      </div>
      <ToastContainer 
        position="top-right"
        autoClose={2000}
        theme="colored"
        transition={Flip}
        closeOnClick
        pauseOnHover={false}
      />
    </div>
  );
};

export default Login;