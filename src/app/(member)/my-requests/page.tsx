"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Tray } from "@phosphor-icons/react";

export default function MyRequestsPage() {
  return (
    <AppShell title="My Requests">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-500/20">
            <Tray className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              My Snack Requests
            </h1>
            <p className="text-xs text-neutral-500">
              Private status tracking for snacks you have requested.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

