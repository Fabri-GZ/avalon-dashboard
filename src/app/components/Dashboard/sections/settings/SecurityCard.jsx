"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock, FiShield, FiCheck, FiAlertCircle, FiMail, FiExternalLink } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";
import { cn } from "@/lib/utils";

import { toast } from "react-toastify";

const SecurityCard = ({ profile, saving, onRequestPasswordReset }) => {
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    const result = await onRequestPasswordReset();

    if (result.success) {
      setResetSent(true);
      toast.success("Enlace de restablecimiento enviado a tu correo");
    } else {
      toast.error(result.error || "Error al solicitar el cambio");
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-background rounded-3xl border border-border/60 p-12 shadow-xl shadow-foreground/5 flex flex-col items-center text-center max-w-4xl mx-auto overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mt-32 blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mb-32 blur-3xl opacity-50" />

      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-4xl bg-primary/10 flex items-center justify-center shadow-inner relative z-10">
          <FiShield className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="max-w-2xl relative z-10 space-y-4 mb-12">
        <h2 className="text-4xl font-extrabold text-foreground tracking-tight">Seguridad de Acceso</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Protegemos tu acceso con estándares de seguridad avanzados para garantizar que tu información esté siempre segura.
        </p>
      </div>

      <div className="w-full max-w-3xl bg-secondary/20 rounded-[2.5rem] p-10 border border-secondary/40 text-left relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
          <div className="p-4 bg-background rounded-2xl shadow-sm border border-secondary shrink-0">
            <FiLock className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-xl font-bold text-foreground">Gestión de Contraseña</h4>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Por seguridad, te enviaremos un enlace de verificación a tu correo registrado para actualizar tu contraseña.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-border flex flex-col items-center md:items-end w-full">
          <AnimatePresence mode="wait">
            {resetSent ? (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col md:flex-row items-center gap-6">
                  <div className="p-3 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-200 shrink-0">
                    <FiCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-lg font-extrabold">¡Email de verificación enviado!</p>
                    <p className="flex items-center justify-center md:justify-start gap-2 font-bold opacity-80">
                      <FiMail className="w-4 h-4" />
                      {profile?.email}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="action-state" className="flex flex-col items-center md:items-end gap-5">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordReset}
                  disabled={saving}
                  className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-extrabold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-w-[280px] text-lg"
                >
                  {saving ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiExternalLink className="w-5 h-5" />
                      Cambiar contraseña ahora
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityCard;

