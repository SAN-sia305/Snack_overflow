"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Package } from "@phosphor-icons/react";

export default function AdminInventoryPage() {
  return (
    <AppShell title="Pantry Inventory">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
            <Package className="w-6 h-6" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Pantry Inventory Management
            </h1>
            <p className="text-xs text-neutral-500">
              Manage snack inventory, configure thresholds, restock, and edit items.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

