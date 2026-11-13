"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ClockCounterClockwise } from "@phosphor-icons/react";

export default function AdminActivityPage() {
  return (
    <AppShell title="Activity Log">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-neutral-800 text-white shadow-md">
            <ClockCounterClockwise className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Pantry Activity Log
            </h1>
            <p className="text-xs text-neutral-500">
              Admin audit log tracking snack consumption and restocking events.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

