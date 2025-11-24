"use client";

import { motion } from "framer-motion";
import NumberTicker from "./NumberTicker";
import { itemVariants } from "./data/mockData";

const StatCard = ({ title, value, change, icon: Icon, index }) => {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05, borderColor: "var(--primary)" }}
      transition={{ duration: 0.2 }}
      className="bg-background rounded-xl p-6 border border-secondary cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-3 rounded-lg bg-primary/10"
        >
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold rounded-lg border p-1.5"
            style={{
              color: change > 0 ? "var(--success-foreground)" : "var(--danger-foreground)",
              background: change > 0 ? "var(--success-background)" : "var(--danger-background)",
              borderColor: change > 0 ? "var(--success-border)" : "var(--danger-border)",
            }}
          >
            {change > 0 ? '+' : ''}{change}%
          </motion.span>
        )}
      </div>
      <h3 className="text-muted-foreground text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-foreground">
        <NumberTicker value={value} />
      </p>
    </motion.div>
  );
};

export default StatCard;