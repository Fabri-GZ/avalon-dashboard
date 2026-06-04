"use client";

import { motion } from "framer-motion";
import { FiMenu, FiCalendar } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useDashboardUI } from "@/contexts/DashboardUIContext";
import { navigation } from "@/app/components/Dashboard/data/dataProcessors";
import { useDateRangeParam } from "@/hooks/useDateRangeParam";
import type { SectionDateRange } from "@/lib/types/dateRange";

const SECTION_RANGES = ['7d', '30d', '3m', 'todo'] as const

const filterOptions: { value: SectionDateRange; label: string }[] = [
  { value: '7d',  label: 'Diario' },
  { value: '30d', label: 'Mensual' },
  { value: '3m',  label: 'Anual' },
]

function resolveTitle(pathname: string | null, activeSection: string): string {
  for (const item of navigation) {
    if (item.children) {
      const child = item.children.find((c: { href: string }) => pathname?.startsWith(c.href));
      if (child) return child.name;
    } else if (item.href && pathname?.startsWith(item.href)) {
      return item.name;
    }
  }
  return navigation.find((item: { id: string; name: string }) => item.id === activeSection)?.name ?? "";
}

const DashboardHeader = () => {
  const { activeSection, setSidebarOpen } = useDashboardUI();
  const pathname = usePathname();
  const [dateRange, setDateRange] = useDateRangeParam<SectionDateRange>(SECTION_RANGES, '30d');

  const displayTitle = resolveTitle(pathname, activeSection);

  return (
    <header className="bg-background h-[95px] px-4 lg:px-8 sticky top-0 z-40 border-b border-border flex items-center">
      <div className="flex items-center justify-between w-full">
        <motion.h2
          key={displayTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
          className="text-2xl font-extrabold text-foreground tracking-tight"
        >
          {displayTitle}
        </motion.h2>

        <div className="flex items-center gap-3">
          <div id="dashboard-header-slot" className="flex items-center gap-3" />

          {['overview', 'website', 'ads'].includes(activeSection) && (
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
                    onClick={() => setDateRange(option.value)}
                    className={`
                      relative px-4 py-1.5 rounded-md text-sm font-[550] transition-all duration-300 ease-in-out
                      ${dateRange === option.value
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }
                    `}
                  >
                    {dateRange === option.value && (
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

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <FiMenu className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
