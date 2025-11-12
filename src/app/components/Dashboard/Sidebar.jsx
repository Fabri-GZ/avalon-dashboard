// app/components/Dashboard/Sidebar.jsx
"use client";

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
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.div
        initial={mobile ? { x: -80 } : false}
        animate={{ x: 0 }}
        exit={mobile ? { x: -80 } : {}}
        transition={{ type: "spring", damping: 20 }}
        className={`${mobile ? 'fixed left-0 top-0 bottom-0 w-20' : 'w-20 h-screen'} bg-black border-r border-gray-800 flex flex-col items-center py-6 ${mobile ? 'z-50' : ''}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-12 h-12 bg-[#A047FF] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
        </motion.div>
        
        <nav className="flex flex-col gap-2 w-full px-2">
          {navigation.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`relative group flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-[#A047FF] text-white'
                    : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-white'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
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
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="mt-auto flex flex-col items-center justify-center gap-1 p-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
          title="Cerrar Sesión"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-xs">Salir</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Sidebar;
