"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiXCircle } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";
import { StatusBadge } from "./badges";

const AccountStatusCard = ({ 
  status, 
  isAdmin, 
  onRequestOffboarding, 
  isUpdating 
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState(null);

  if (!isAdmin) return null;

  const isOffboarding = status === 'offboarding';

  const handleConfirm = async () => {
    const response = await onRequestOffboarding();
    setShowConfirmModal(false);
    
    if (response.success) {
      setResult({ 
        success: true, 
        url: response.offboardingUrl,
        message: 'La cuenta ha sido dada de baja correctamente.'
      });
    } else {
      setResult({ 
        success: false, 
        message: response.error || 'Hubo un error al procesar la solicitud.'
      });
    }
  };

  const closeResultModal = () => setResult(null);

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
            onClick={() => setShowConfirmModal(true)}
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
        {/* Confirmation Modal */}
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
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
                Esta acción puede tardar unos minutos.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
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

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={closeResultModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 border border-secondary shadow-2xl max-w-md w-full"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-4 ${result.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {result.success ? (
                    <FiCheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <FiXCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {result.success ? 'Solicitud procesada' : 'Error'}
                </h4>
                
                <p className="text-muted-foreground mb-6">
                  {result.message}
                </p>

                {result.success && result.url && (
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mb-4 w-full justify-center"
                    onClick={closeResultModal}
                  >
                    <span>Visitar Offboarding</span>
                    <FiExternalLink />
                  </a>
                )}

                <button
                  onClick={closeResultModal}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cerrar
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
