"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass } from "@phosphor-icons/react";

export default function ExplorePage() {
  return (
    <AppShell title="Explore Snacks">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
            <Compass className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Explore Pantry
            </h1>
            <p className="text-xs text-neutral-500">
              Discover and search all snacks in the office pantry.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

