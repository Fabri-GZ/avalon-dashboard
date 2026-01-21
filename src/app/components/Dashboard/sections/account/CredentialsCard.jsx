"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { cardVariants } from "../../data/dataProcessors";
import { getProviderIcon, formatRelativeDate } from "./utils";

const CredentialsCard = ({ credentials }) => {
  const [visiblePasswords, setVisiblePasswords] = useState({});

  if (!credentials || credentials.length === 0) return null;

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      className="bg-background rounded-xl p-8 border border-secondary h-full"
    >
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <FiLock className="w-6 h-6 text-primary" />
        </div>
        Accesos
      </h3>

      <div className="space-y-4">
        {credentials.map((cred, index) => (
          <motion.div
            key={cred.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-xl bg-secondary/30 border border-secondary hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-background border border-secondary shrink-0">
                {getProviderIcon(cred.provider)}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {cred.provider || 'Credencial'}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {formatRelativeDate(cred.last_sync_at)}
                  </span>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20">Usuario:</span>
                    <span className="text-sm font-medium text-foreground">{cred.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20">Contraseña:</span>
                    <span className="text-sm font-mono text-foreground">
                      {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(cred.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title={visiblePasswords[cred.id] ? "Ocultar" : "Mostrar"}
                    >
                      {visiblePasswords[cred.id] ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CredentialsCard;
