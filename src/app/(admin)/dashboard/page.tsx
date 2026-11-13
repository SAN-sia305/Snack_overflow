"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SquaresFour } from "@phosphor-icons/react";

export default function AdminDashboardPage() {
  return (
    <AppShell title="Admin Operations Dashboard">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
            <SquaresFour className="w-6 h-6" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Pantry Operations Dashboard
            </h1>
            <p className="text-xs text-neutral-500">
              Live pantry health, smart restock alerts, and demand overview.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

