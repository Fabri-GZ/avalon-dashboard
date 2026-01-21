"use client";

import { motion } from "framer-motion";

export const ServiceBadge = ({ service }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
  >
    {service}
  </motion.span>
);

export const StatusBadge = ({ status }) => {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      isActive 
        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' 
        : 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
    }`}>
      {isActive ? 'Activo' : 'En baja'}
    </span>
  );
};
