"use client";
import { motion } from "framer-motion";

export default function CommercialPage() {
  return (
    <motion.div
      key="commercial"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Comercial</h1>
          <p className="text-muted-foreground">Próximamente</p>
        </div>
      </div>
    </motion.div>
  );
}
