"use client";

import Link from "next/link";
import { useCurrentUser } from "@/store/useAuthStore";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { RoleBadge } from "./RoleBadge";
import { Cookie } from "@phosphor-icons/react";

export function TopBar({ title }: { title?: string }) {
  const currentUser = useCurrentUser();
  const homeHref = currentUser.role === "admin" ? "/dashboard" : "/home";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Brand Identity & Current Context */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 font-bold text-neutral-900 dark:text-neutral-50 hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25">
              <Cookie className="w-5 h-5" weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight leading-tight">
                Snack Overflow
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
                Bipolar Factory
              </span>
            </div>
          </Link>

          {title && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">/</span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 hidden sm:inline">
                {title}
              </span>
            </>
          )}
        </div>

        {/* Right: Role, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xs:flex items-center">
            <RoleBadge role={currentUser.role} />
          </div>

          <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden xs:block" />

          <ThemeToggle />

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

