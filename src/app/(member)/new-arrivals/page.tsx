"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Sparkle } from "@phosphor-icons/react";

export default function NewArrivalsPage() {
  return (
    <AppShell title="New Arrivals">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Sparkle className="w-6 h-6" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              New Arrivals
            </h1>
            <p className="text-xs text-neutral-500">
              Snacks recently added to the pantry within the last 7 days.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

