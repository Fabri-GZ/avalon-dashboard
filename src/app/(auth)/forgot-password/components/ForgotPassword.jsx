"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MdMail, MdArrowBack } from "react-icons/md";
import { Mail, CheckCircle } from "lucide-react";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { resetPassword } from "@/lib/auth-actions";

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email) => {
    return email.includes("@") && email.includes(".");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setEmailError(true);
      toast.error("Por favor, ingrese una dirección de correo válida");
      setTimeout(() => setEmailError(false), 1000);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    try {
      await resetPassword(formData);
      setEmailSent(true);
      toast.success("Email enviado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error al enviar el correo. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  };

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg p-8 w-full max-w-md mx-auto bg-card border border-border shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 bg-[#7bf1a8] rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-[#0d542b]" />
        </motion.div>

        <h2 className="text-2xl font-bold text-center text-foreground mb-3">
          ¡Revisa tu correo!
        </h2>

        <div className="text-center mb-6">
          <p className="text-muted-foreground mb-3">
            Te enviamos un email para restablecer tu contraseña a:
          </p>
          <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-3 mb-3">
            <Mail className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">{email}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Hace click en el enlace del correo para crear una nueva contraseña.
          </p>
        </div>

        <div className="bg-accent/50 border border-accent rounded-lg p-3 mb-6">
          <p className="text-xs text-foreground">
            💡 <strong>Tip:</strong> Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = "/login"}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg transition-colors"
        >
          Volver al inicio de sesión
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="rounded-lg p-8 w-full max-w-md mx-auto bg-card border border-border shadow-xl"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <MdArrowBack size={20} />
        <span className="text-sm font-medium">Volver</span>
      </button>

      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl font-bold text-primary mb-2"
        >
          ¿Olvidaste tu contraseña?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-muted-foreground"
        >
          Te enviaremos un email para restablecerla
        </motion.p>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative mb-3"
        >
          <motion.div animate={emailError ? shakeAnimation : {}}>
            <motion.div
              animate={emailError ? { color: "var(--destructive)" } : { color: "var(--muted-foreground)" }}
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
              required
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 bg-input rounded-lg text-foreground outline-none transition-colors ${
                emailError
                  ? "border-2 border-destructive"
                  : "border border-border focus:border-primary hover:border-primary"
              }`}
            />
          </motion.div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Enviando..." : "Enviar email de recuperación"}
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
  );
};

export default ForgotPassword;