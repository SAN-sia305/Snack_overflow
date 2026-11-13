"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TopBar } from "./TopBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ToastContainer } from "@/components/ui/toast";
import { toast } from "@/store/useToastStore";

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
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
      return;
    }

    // Role-based route guard
    const isCurrentAdminRoute = ADMIN_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isCurrentAdminRoute && currentUser.role !== "admin") {
      toast.warning(
        "Admin Access Required",
        "Only Pantry Leads can access management areas. Redirecting to Pantry Home."
      );
      router.push("/home");
    }
  }, [pathname, currentUser.role, isAuthenticated, router]);

  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <ToastContainer />
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
