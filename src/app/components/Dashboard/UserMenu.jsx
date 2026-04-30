"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Settings, LogOut, User, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

const UserMenu = ({ onLogout, theme, setTheme, profile }) => {
  const name = profile?.full_name || "Usuario";
  const email = profile?.email || "";
  const avatar = profile?.avatar_url;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full focus:outline-none">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors duration-200 cursor-pointer">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl border border-border/50 shadow-xl backdrop-blur-sm bg-background/95 p-2" align="end" side="top" sideOffset={8}>
        <DropdownMenuItem asChild className="flex gap-3 cursor-pointer p-3 rounded-lg data-highlighted:bg-muted data-highlighted:text-foreground transition-all ease-in duration-200">
          <Link href="/dashboard/settings">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex gap-3 cursor-pointer p-3 rounded-lg data-highlighted:bg-muted data-highlighted:text-foreground transition-all ease-in duration-200"
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
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={onLogout}
          className="flex gap-3 cursor-pointer p-3 rounded-lg data-highlighted:bg-muted data-highlighted:text-destructive transition-all ease-in duration-200 group"
        >
          <LogOut className="w-4 h-4 transition-colors group-hover:text-destructive" />
          <span className="group-hover:text-destructive">Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
