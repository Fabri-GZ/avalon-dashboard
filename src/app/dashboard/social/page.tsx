"use client";
import { motion } from "framer-motion";

export default function SocialPage() {
  return (
    <motion.div
      key="social"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Redes Sociales</h2>
          <p className="text-muted-foreground">Próximamente</p>
        </div>
      </div>
    </motion.div>
  );
}
