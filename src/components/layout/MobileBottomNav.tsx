"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import {
  House,
  Compass,
  Sparkle,
  Tray,
  SquaresFour,
  Package,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser.role === "admin";

  const memberNav = [
    { label: "Home", href: "/home", icon: House },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Arrivals", href: "/new-arrivals", icon: Sparkle },
    { label: "Requests", href: "/my-requests", icon: Tray },
  ];

  const adminNav = [
    { label: "Dashboard", href: "/dashboard", icon: SquaresFour },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Requests", href: "/requests", icon: Tray },
    { label: "Activity", href: "/activity", icon: ClockCounterClockwise },
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-lg px-2 py-1.5"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all",
                isActive
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-transform",
                  isActive && "bg-orange-100 dark:bg-orange-950/60 scale-110"
                )}
              >
                <Icon
                  className="w-5 h-5 shrink-0"
                  weight={isActive ? "fill" : "regular"}
                />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

