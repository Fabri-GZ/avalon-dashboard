"use client";

import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";

const DashboardHeader = ({ activeTab, setSidebarOpen, navigation }) => {
  return (
    <header
      className="bg-white p-4 lg:p-6 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        <motion.button
          initial={{opacity: 0, x:-20}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: 0.5, delay: 0.2, ease: "easeIn"}}
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-700 hover:text-black"
        >
          <FiMenu className="w-6 h-6" />
        </motion.button>
        <motion.h2
          key={activeTab}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{duration: 0.5, delay: 0.2, ease: "easeIn"}}
          className="text-2xl font-bold text-gray-700"
        >
          {navigation.find(item => item.id === activeTab)?.name}
        </motion.h2>
      </div>
    </header>
  );
};

export default DashboardHeader;