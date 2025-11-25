"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdLock } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updatePassword } from "@/lib/auth-actions";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setPasswordError(true);
      toast.error("La contraseña debe tener al menos 8 caracteres");
      setTimeout(() => setPasswordError(false), 1000);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("password", password);

    try {
      await updatePassword(formData);
      toast.success("Contraseña actualizada correctamente");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f1f8]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="rounded-lg p-8 w-full max-w-md mx-auto bg-[#f4f1f8] shadow-[20px_20px_60px_#cfcdd3,-20px_-20px_60px_#ffffff]"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-bold text-[#A047FF] mb-2"
          >
            Nueva contraseña
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-gray-700"
          >
            Ingresa tu nueva contraseña
          </motion.p>
        </div>

        <div className="space-y-4">
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                required
                disabled={isLoading}
                className={`w-full pl-10 pr-12 py-3 bg-[#f4f1f8] rounded-lg text-black outline-none ${
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            className="relative mb-3"
          >
            <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-12 py-3 bg-[#f4f1f8] border border-[#D4BBFC] rounded-lg text-black outline-none focus:border-[#A047FF] hover:border-[#A047FF]"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#A047FF] z-10"
            >
              {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mt-3"
          >
            <motion.div
              animate={{
                backgroundColor: password.length >= 8 ? "#10b981" : "transparent",
                borderColor: password.length >= 8 ? "#10b981" : "#9ca3af",
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-4 h-4 rounded-full border flex items-center justify-center ml-1"
            >
              {password.length >= 8 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <FaCheck className="text-white text-[10px]" />
                </motion.div>
              )}
            </motion.div>
            <span
              className={`text-sm ${
                password.length >= 8 ? "text-green-600" : "text-gray-500"
              }`}
            >
              Usá mínimo 8 caracteres
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                backgroundColor: password && password === confirmPassword ? "#10b981" : "transparent",
                borderColor: password && password === confirmPassword ? "#10b981" : "#9ca3af",
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-4 h-4 rounded-full border flex items-center justify-center ml-1"
            >
              {password && password === confirmPassword && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <FaCheck className="text-white text-[10px]" />
                </motion.div>
              )}
            </motion.div>
            <span
              className={`text-sm ${
                password && password === confirmPassword ? "text-green-600" : "text-gray-500"
              }`}
            >
              Las contraseñas coinciden
            </span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#A047FF] hover:bg-[#8c3de6] text-white font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Actualizando..." : "Actualizar contraseña"}
          </motion.button>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="colored"
          transition={Flip}
          closeOnClick
          pauseOnHover={false}
        />
      </motion.div>
    </div>
  );
};

export default ResetPassword;