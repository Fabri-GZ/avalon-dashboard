"use client";

import { motion } from "framer-motion";
import { FiMenu, FiCalendar } from "react-icons/fi";

const DashboardHeader = ({ activeTab, setSidebarOpen, navigation, timeFilter, setTimeFilter }) => {
  const filterOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'annual', label: 'Anual' }
  ]
  return (
    <header className="bg-background p-4 lg:p-6 sticky top-0 z-40 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <FiMenu className="w-6 h-6" />
          </motion.button>
          
          <motion.h2
            key={activeTab}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
            className="text-2xl font-bold text-foreground"
          >
            {navigation.find(item => item.id === activeTab)?.name}
          </motion.h2>
        </div>

        {['overview', 'website', 'ads'].includes(activeTab) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <FiCalendar className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <div className="flex bg-secondary rounded-lg p-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value)}
                  className={`
                    relative px-4 py-1.5 rounded-md text-sm font-[550] transition-all duration-300 ease-in-out
                    ${timeFilter === option.value
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }
                  `}
                >
                  {timeFilter === option.value && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-primary rounded-md shadow-md"
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        duration: 0.4 
                      }}
                      style={{ originY: "center" }}
                    />
                  )}
                  <span className="relative z-10">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;