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
      whileHover={{ scale: 1.05, borderColor: "rgba(160, 71, 255, 0.5)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl p-6 border border-gray-300 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-3 rounded-lg bg-[#A047FF]/10"
        >
          <Icon className="w-6 h-6 text-[#A047FF]" />
        </div>
        {change !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-sm font-semibold rounded-md border p-1.5 ${change > 0 ? 'text-green-300 bg-green-900 border-green-300' : 'text-red-300 bg-red-900 border-red-300'}`}
          >
            {change > 0 ? '+' : ''}{change}%
          </motion.span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-black">
        <NumberTicker value={value} />
      </p>
    </motion.div>
  );
};

export default StatCard;