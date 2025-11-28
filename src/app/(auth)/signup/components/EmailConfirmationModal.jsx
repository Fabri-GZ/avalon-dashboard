"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

const EmailConfirmationModal = ({ isOpen, email, onClose }) => {
  const handleRefresh = () => {
    window.location.href = "/login";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center text-foreground mb-3"
              >
                ¡Revisa tu correo!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-6"
              >
                <p className="text-muted-foreground mb-3">
                  Te enviamos un email de confirmación a:
                </p>
                <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-3 mb-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">{email}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hace click en el enlace del correo para activar tu cuenta y poder iniciar sesión.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6"
              >
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRefresh}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Ir al inicio de sesión
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full text-sm text-muted-foreground mt-3 transition-colors"
              >
                Cerrar
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailConfirmationModal;