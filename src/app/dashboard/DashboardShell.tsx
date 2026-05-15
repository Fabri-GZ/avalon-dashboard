"use client";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { DashboardDataProvider, useDashboardData } from "@/contexts/DashboardDataContext";
import { DashboardUIProvider, useDashboardUI } from "@/contexts/DashboardUIContext";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import DashboardHeader from "@/app/components/Dashboard/DashboardHeader";
import Loader from "@/app/components/Loader/loader";
import { ClientToast } from "./ClientToast";
import { DashboardErrorBoundary } from "./DashboardErrorBoundary";
import { createClient } from "@/app/utils/supabase/client";
import type { Role } from "@/lib/permissions";

interface DashboardShellProps {
  children: React.ReactNode;
  initialRole: Role;
  initialAllowedSections: string[];
  initialUserId: string;
  initialPmGids?: string[] | null;
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { dataLoading } = useDashboardData();
  const { sidebarOpen, setSidebarOpen } = useDashboardUI();

  const sidebarVariant = pathname.startsWith("/dashboard/settings") ? "settings" : "dashboard";

  // PM client detail pages render their own header (ClientHeader) — hide the
  // global one to avoid the "doble header" feel and reclaim vertical space.
  const isPmClientRoute = /^\/dashboard\/pm\/[^/]+$/.test(pathname);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-secondary lg:flex flex-row">
      <Sidebar
        mobile={false}
        variant={sidebarVariant}
        onLogout={handleLogout}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            mobile={true}
            variant={sidebarVariant}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      <div className="w-full">
        {!isPmClientRoute && <DashboardHeader />}

        <main className={isPmClientRoute ? "" : "p-4 lg:p-6"}>
          {dataLoading ? (
            <Loader />
          ) : (
            <AnimatePresence mode="wait" key={pathname}>
              {children}
            </AnimatePresence>
          )}
        </main>
      </div>

      <ClientToast />
    </div>
  );
}

export default function DashboardShell({
  children,
  initialRole,
  initialAllowedSections,
  initialUserId,
  initialPmGids,
}: DashboardShellProps) {
  return (
    <DashboardErrorBoundary>
      <DashboardDataProvider
        initialRole={initialRole}
        initialAllowedSections={initialAllowedSections}
        initialUserId={initialUserId}
        initialPmGids={initialPmGids}
      >
        <DashboardUIProvider>
          <ShellInner>{children}</ShellInner>
        </DashboardUIProvider>
      </DashboardDataProvider>
    </DashboardErrorBoundary>
  );
}
