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
  PlusCircle,
} from "@phosphor-icons/react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser.role === "admin";

  const memberNav = [
    { label: "Home", href: "/home", icon: House },
    { label: "Explore Snacks", href: "/explore", icon: Compass },
    { label: "New Arrivals", href: "/new-arrivals", icon: Sparkle },
    { label: "My Requests", href: "/my-requests", icon: Tray },
  ];

  const adminNav = [
    { label: "Dashboard", href: "/dashboard", icon: SquaresFour },
    { label: "Pantry Inventory", href: "/inventory", icon: Package },
    { label: "Snack Requests", href: "/requests", icon: Tray },
    { label: "Activity Log", href: "/activity", icon: ClockCounterClockwise },
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/40 p-4 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {isAdmin ? "Pantry Management" : "Pantry Discovery"}
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-neutral-100"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive
                    ? "text-orange-500"
                    : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
                )}
                weight={isActive ? "fill" : "regular"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Quick Action Pill */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-neutral-200/70 dark:border-neutral-800/70">
          <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Quick Actions
          </p>
          <div className="mt-2 space-y-1.5">
            <Link
              href="/inventory?action=add"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white transition-all"
            >
              <PlusCircle className="w-4 h-4 shrink-0" weight="bold" />
              <span>Add New Snack</span>
            </Link>
          </div>
        </div>
      )}

      {/* Current account role */}
      <div className="mt-auto pt-4 border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Signed in as
            </span>
            <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {currentUser.name}
          </p>
        </div>
      </div>
    </aside>
  );
}

