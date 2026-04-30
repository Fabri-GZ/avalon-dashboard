"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RxDashboard } from "react-icons/rx";
import { FiGlobe, FiDollarSign, FiMessageSquare, FiUser, FiShield, FiArrowLeft } from "react-icons/fi";
import { Sun, Moon, Settings, LogOut, User, ChevronsUpDown, Check, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import UserMenu from "./UserMenu";
import Link from "next/link";
import { useRouter } from "next/navigation";

const iconMap = {
  RxDashboard,
  FiGlobe,
  FiDollarSign,
  FiMessageSquare,
  FiUser,
  FiShield,
  FiArrowLeft,
};

const CompanySwitcher = ({ clients, selectedClient, onClientChange, mobile }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between rounded-xl transition-all duration-200",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "border border-border/50 hover:border-border",
            mobile ? "p-4" : "px-4 py-3"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
              {selectedClient?.logo_url ? (
                <img
                  src={selectedClient.logo_url}
                  alt={selectedClient.company_name}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-foreground text-md">
                {selectedClient?.company_name || "Seleccionar Empresa"}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/70 transition-transform duration-200" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] rounded-xl border border-border/50 shadow-xl backdrop-blur-sm bg-background/95 p-2"
        align="start"
        side={mobile ? "bottom" : "right"}
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Teams
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[320px] overflow-y-auto space-y-1">
          {clients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <DropdownMenuItem
                key={client.id}
                onClick={() => {
                  onClientChange(client.id);
                  setOpen(false);
                }}
                className={cn(
                  "gap-3 p-3 cursor-pointer rounded-lg transition-all duration-200",
                  "hover:bg-accent/50 focus:bg-accent/50",
                  "group relative overflow-hidden",
                  isSelected && "bg-primary/5 hover:bg-primary/10"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                  "bg-linear-to-br shadow-sm",
                  isSelected 
                    ? "from-primary/20 to-primary/10 border-primary/30" 
                    : "from-accent/50 to-accent/30 border-border/50 group-hover:border-border"
                )}>
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.company_name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className={cn(
                      "h-4 w-4 transition-colors duration-200",
                      isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={cn(
                    "text-sm font-medium truncate transition-colors duration-200",
                    isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                  )}>
                    {client.company_name}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem className="gap-3 p-3 cursor-pointer rounded-lg hover:bg-accent/50 transition-all duration-200 group">
          <Link href="/admin/create-client">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border/50 group-hover:border-primary/50 transition-colors duration-200">
            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">
            Agregar Cliente
          </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Sidebar = ({ 
  mobile, 
  activeTab, 
  setActiveTab, 
  setSidebarOpen, 
  onLogout, 
  navigation: dashboardNavigation, 
  profile, 
  userRole, 
  clients, 
  selectedClient, 
  onClientChange,
  variant = "dashboard"
}) => {
  const router = useRouter();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem('theme', 'dark'); 
    } else {
      root.classList.remove("dark");
      localStorage.setItem('theme', 'light'); 
    }
  }, [theme]);

  const isAdminGlobal = userRole === 'admin_global';

  return (
    <div className={`${mobile ? 'fixed inset-0 z-50 lg:hidden' : 'hidden lg:flex'}`}>
      {mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
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
        } bg-background border-r border-border flex flex-col ${mobile ? 'z-50 shadow-2xl' : ''}`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full px-4 border-b border-border h-[95px] flex items-center"
        >
          {isAdminGlobal ? (
            <CompanySwitcher 
              clients={clients} 
              selectedClient={selectedClient} 
              onClientChange={onClientChange}
              mobile={mobile}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Image 
                src="/logo-avalon.png"
                alt="Avalon Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-primary">Avalon</h1>
              </div>
            </div>
          )}
        </motion.div>

        <nav className="flex-1 flex flex-col p-4">
          <div className="flex flex-col gap-2">
            {(variant === "settings" 
              ? [
                { id: "profile", name: "Perfil", icon: "FiUser" },
                { id: "security", name: "Seguridad", icon: "FiShield" }
              ]
              : dashboardNavigation
            ).map((item, idx) => {
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
                className={`relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary font-medium"
                }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-md">{item.name}</span>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-auto">
          {variant === "settings" && (
            <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary font-bold bg-primary/5 hover:bg-primary/10 transition-all duration-200 mb-4 w-full"
              >
              <FiArrowLeft className="w-5 h-5" />
              <span>Volver al Dashboard</span>
            </motion.button>
          )}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <UserMenu onLogout={onLogout} theme={theme} setTheme={setTheme} profile={profile} />
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;