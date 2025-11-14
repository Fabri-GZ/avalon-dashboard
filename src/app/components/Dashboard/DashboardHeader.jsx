"use client";

import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";

const DashboardHeader = ({ activeTab, setSidebarOpen, navigation }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 15 }}
      className="bg-[#f4f1f8] p-4 lg:p-6 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <FiMenu className="w-6 h-6" />
        </button>
        <motion.h2
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white"
        >
          {navigation.find(item => item.id === activeTab)?.name}
        </motion.h2>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-[#A047FF] rounded-full flex items-center justify-center text-white font-semibold">
            CM
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;