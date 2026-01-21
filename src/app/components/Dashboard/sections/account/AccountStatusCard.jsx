"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";
import { StatusBadge } from "./badges";

const AccountStatusCard = ({ 
  status, 
  isAdmin, 
  onRequestOffboarding, 
  isUpdating 
}) => {
  const [showModal, setShowModal] = useState(false);
  if (!isAdmin) return null;

  const isOffboarding = status === 'offboarding';

  const handleConfirm = async () => {
    await onRequestOffboarding();
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
        className="bg-background rounded-xl p-6 border-2 border-dashed border-destructive/30"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FiAlertCircle className="w-5 h-5 text-destructive" />
          Estado de la cuenta
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Estado actual:</p>
            <StatusBadge status={status} />
          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={isOffboarding || isUpdating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isOffboarding || isUpdating
                ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
          >
            {isUpdating ? 'Procesando...' : isOffboarding ? 'Baja solicitada' : 'Solicitar baja'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 border border-secondary shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <FiAlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">
                  Confirmar solicitud de baja
                </h4>
              </div>

              <p className="text-muted-foreground mb-6">
                ¿Estás seguro de que deseas solicitar la baja de esta cuenta? 
                Esta acción cambiará el estado a "En baja".
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-secondary text-foreground hover:bg-secondary/50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Procesando...' : 'Confirmar baja'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccountStatusCard;
