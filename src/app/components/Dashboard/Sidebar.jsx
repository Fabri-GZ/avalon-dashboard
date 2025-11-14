"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RxDashboard } from "react-icons/rx";
import { FiGlobe, FiDollarSign, FiMessageSquare, FiLogOut } from "react-icons/fi";

const iconMap = {
  RxDashboard,
  FiGlobe,
  FiDollarSign,
  FiMessageSquare,
};

const Sidebar = ({ mobile, activeTab, setActiveTab, setSidebarOpen, onLogout, navigation }) => {
  return (
    <div className={`${mobile ? 'fixed inset-0 z-50 lg:hidden' : 'hidden lg:flex'}`}>
      {mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#f4f1f8]"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.div
        initial={mobile ? { x: -80 } : false}
        animate={{ x: 0 }}
        exit={mobile ? { x: -80 } : {}}
        transition={{ type: "spring", damping: 20 }}
        className={`${mobile ? 'fixed left-0 top-0 bottom-0 w-20' : 'w-60 h-screen'} bg-[#f4f1f8] flex flex-col items-center py-6 ${mobile ? 'z-50' : ''}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-8 w-full flex items-center justify-start px-4"
        >
          <div className="flex items-center gap-3">
            <Image 
            src = "/logo-avalon.png"
            alt = "Avalon Logo"
            width = {42}
            height = {42}
            className = "object-contain"
            />
            <span className="text-xl font-semibold text-[#a047ff]">
              Avalon
            </span>
          </div>
        </motion.div>
        
        <nav className="flex flex-col gap-2 w-full px-3">
          {navigation.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`relative group flex flex-row items-center gap-4 p-3 rounded-md transition-all ${
                  activeTab === item.id
                    ? "bg-[#A047FF] text-white"
                    : "text-gray-600 hover:bg-[#e8d9ff] hover:text-[#A047FF]"
                }`}
              >
                <Icon className="w-5 h-5" />
              
                <span className="text-md font-medium">{item.name}</span>
              
                <AnimatePresence>
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#A047FF] rounded-r"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>
        <div className="flex flex-col w-full px-3 mt-auto">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="mt-auto flex flex-row items-center justify-start gap-1 p-3 rounded-md text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
            title="Cerrar Sesión"
            >
            <FiLogOut className="w-6 h-6" />
            <span className="text-md ml-2">Salir</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
