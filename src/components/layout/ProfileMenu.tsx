"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { RoleBadge } from "./RoleBadge";
import {
  SignOut,
  ArrowsLeftRight,
  Sun,
  Moon,
  CaretDown,
  User as UserIcon,
} from "@phosphor-icons/react";
import { useThemeStore } from "@/store/useThemeStore";
import { toast } from "@/store/useToastStore";

export function ProfileMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentUser, switchRole, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchRole = () => {
    switchRole();
    const newRole = currentUser.role === "admin" ? "member" : "admin";
    toast.info(
      `Switched to ${newRole === "admin" ? "Admin" : "Member"} Mode`,
      `Acting as ${newRole === "admin" ? "Arun Kumar (Pantry Lead)" : "Priya Sharma"}`
    );
    setIsOpen(false);
    if (newRole === "admin") {
      router.push("/dashboard");
    } else {
      router.push("/home");
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-200 ring-2 ring-orange-500/30">
          <Image
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-neutral-500 capitalize">
            {currentUser.role}
          </span>
        </div>
        <CaretDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Identity Header */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-neutral-400">Signed in as</span>
              <RoleBadge role={currentUser.role} />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{currentUser.email}</p>
            {currentUser.department && (
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                {currentUser.department}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={handleSwitchRole}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left"
            >
              <ArrowsLeftRight className="w-4 h-4 text-orange-500 shrink-0" weight="bold" />
              <div className="flex-1">
                <span>Switch to {currentUser.role === "admin" ? "Member" : "Admin"}</span>
                <p className="text-[10px] text-neutral-400">
                  Quick demo evaluation
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-neutral-500 shrink-0" weight="bold" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" weight="bold" />
              )}
              <span>Switch to {theme === "light" ? "Dark" : "Light"} mode</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-neutral-100 dark:border-neutral-800/80 p-1.5 mt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
            >
              <SignOut className="w-4 h-4 shrink-0" weight="bold" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

