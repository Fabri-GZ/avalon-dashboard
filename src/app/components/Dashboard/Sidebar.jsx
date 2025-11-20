"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RxDashboard } from "react-icons/rx";
import { FiGlobe, FiDollarSign, FiMessageSquare } from "react-icons/fi";
import { Sun, Moon, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const iconMap = {
  RxDashboard,
  FiGlobe,
  FiDollarSign,
  FiMessageSquare,
};

const UserMenu = ({ onLogout, theme, setTheme }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full focus:outline-none">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#a047ff] to-[#7c2fd9] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900">Usuario</p>
            <p className="text-xs text-gray-500">user@email.com</p>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" side="top">
        <DropdownMenuItem className="flex gap-3 cursor-pointer py-2">
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex gap-3 cursor-pointer py-2"
        >
          {theme === "light" ? (
            <>
              <Moon className="w-4 h-4" />
              <span>Modo oscuro</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4" />
              <span>Modo claro</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="flex gap-3 cursor-pointer py-2 text-gray-900 group  data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-500 transition-all ease-in duration-200"
        >
          <LogOut className="w-4 h-4 transition-colors group-hover:text-red-500" />
          <span className="group-hover:text-red-500">Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Sidebar = ({ mobile, activeTab, setActiveTab, setSidebarOpen, onLogout, navigation }) => {
  const [theme, setTheme] = useState("light");

  return (
    <div className={`${mobile ? 'fixed inset-0 z-50 lg:hidden' : 'hidden lg:flex'}`}>
      {mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.div
        initial={mobile ? { x: -280 } : false}
        animate={{ x: 0 }}
        exit={mobile ? { x: -280 } : {}}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`${
          mobile ? 'fixed left-0 top-0 bottom-0 w-72' : 'w-72 h-screen sticky top-0'
        } bg-white border-r border-gray-200 flex flex-col ${mobile ? 'z-50 shadow-2xl' : ''}`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex items-center justify-start px-4 py-6.5 mb-2 border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
              <Image 
                src={"/logo-avalon.png"}
                alt="Avalon Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            <div>
              <h1 className="text-xl font-semibold text-[#a047ff]">Avalon</h1>
            </div>
          </div>
        </motion.div>
        <nav className="flex-1 flex flex-col gap-1 px-4 py-6 overflow-y-auto">
          {navigation.map((item, idx) => {
            const Icon = iconMap[item.icon];
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`relative group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-[#a047ff]/10 text-[#a047ff] font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-[#e8d9ff] hover:text-[#A047FF] font-medium"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      exit={{ scaleY: 0, opacity: 0 }}
                      transition={{ ease: "easeIn" }}
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#A047FF] rounded-r"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* User Menu en la parte inferior */}
        <div className="px-4 py-4 border-t border-gray-100">
          <UserMenu onLogout={onLogout} theme={theme} setTheme={setTheme} />
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;