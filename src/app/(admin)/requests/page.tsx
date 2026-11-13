"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Tray } from "@phosphor-icons/react";

export default function AdminRequestsPage() {
  return (
    <AppShell title="Snack Demand Management">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Tray className="w-6 h-6" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Snack Requests & Demand Management
            </h1>
            <p className="text-xs text-neutral-500">
              Product-level demand aggregation ranked by distinct verified employee interest.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

