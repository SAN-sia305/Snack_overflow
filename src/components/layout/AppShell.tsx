"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TopBar } from "./TopBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ToastContainer } from "@/components/ui/toast";
import { toast } from "@/store/useToastStore";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const ADMIN_ROUTES = ["/dashboard", "/inventory", "/requests", "/activity"];

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, status, refresh } = useAuthStore();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    // Role-based route guard
    const isCurrentAdminRoute = ADMIN_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (
      isCurrentAdminRoute &&
      currentUser &&
      currentUser.role !== "admin"
    ) {
      toast.warning(
        "Admin Access Required",
        "Only Pantry Leads can access management areas. Redirecting to Pantry Home."
      );
      router.replace("/home");
    }
  }, [pathname, currentUser, isAuthenticated, router, status]);

  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <ToastContainer />
      </div>
    );
  }

  if (status === "error" || !isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        {status === "error" ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-300" role="alert">
              Unable to verify your session. Please retry.
            </p>
            <Button variant="outline" onClick={() => void refresh()}>
              Retry
            </Button>
          </>
        ) : (
          <>
            <CircleNotch className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-sm text-neutral-500">Checking your session…</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <TopBar title={title} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <DesktopSidebar />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
}
