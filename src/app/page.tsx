"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { CircleNotch } from "@phosphor-icons/react";

export default function RootIndexPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (currentUser.role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/home");
    }
  }, [currentUser.role, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="flex items-center gap-3 text-orange-500">
        <CircleNotch className="w-6 h-6 animate-spin" weight="bold" />
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Entering Snack Overflow...
        </span>
      </div>
    </div>
  );
}
