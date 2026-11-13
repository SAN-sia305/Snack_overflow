"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { Sparkle, Cookie, Fire, Heart } from "@phosphor-icons/react";
import Link from "next/link";

export default function Home() {
  const { currentUser, switchRole } = useAuthStore();

  const handleTestToast = () => {
    toast.success("Welcome to Snack Overflow!", "Design tokens, shell, and theming loaded.");
  };

  const handleConflictToast = () => {
    toast.conflict(
      "Out of stock!",
      "Someone beat you to the last packet. Better luck next time."
    );
  };

  return (
    <AppShell title="Design System & Shell Preview">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-600 to-amber-600 p-8 md:p-10 text-white shadow-xl shadow-orange-500/15">
          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>Step 1 Baseline Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Good snacks.
              <br />
              Great office energy.
            </h1>
            <p className="text-orange-100 text-sm md:text-base leading-relaxed">
              Welcome to the Snack Overflow Living Pantry for Bipolar Factory.
              Currently viewing in{" "}
              <span className="font-bold underline decoration-white/50 capitalize">
                {currentUser.role} mode
              </span>{" "}
              as {currentUser.name}.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={switchRole}
                className="bg-white text-orange-700 hover:bg-orange-50 shadow-md font-semibold"
              >
                Switch to {currentUser.role === "admin" ? "Member" : "Admin"} View
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleTestToast}
                className="border-white/40 text-white hover:bg-white/10"
              >
                Test Toast
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleConflictToast}
                className="border-white/40 text-white hover:bg-white/10"
              >
                Test Conflict
              </Button>
            </div>
          </div>

          <Cookie
            className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 pointer-events-none rotate-12"
            weight="fill"
          />
        </div>

        {/* Tokens & UI Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fire className="w-5 h-5 text-orange-500" weight="fill" />
                <span>Pantry Status Tokens</span>
              </CardTitle>
              <CardDescription>
                Visual status cues communicating availability without relying on color alone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="stocked" dot>
                  Stocked (Available)
                </Badge>
                <Badge variant="running_low" dot>
                  Running Low (≤ 5 units)
                </Badge>
                <Badge variant="gone" dot>
                  Gone (0 units)
                </Badge>
                <Badge variant="new">New Arrival</Badge>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-2">Category Badges:</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Sweet</Badge>
                  <Badge variant="secondary">Savoury</Badge>
                  <Badge variant="secondary">Drink</Badge>
                  <Badge variant="secondary">Healthy-ish</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" weight="fill" />
                <span>Interactive Primitives</span>
              </CardTitle>
              <CardDescription>
                Buttons with accessible states, spring animations, and theme-aware contrast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm">
                  Primary Action
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary
                </Button>
                <Button variant="outline" size="sm">
                  Outline
                </Button>
                <Button variant="destructive" size="sm">
                  Destructive
                </Button>
                <Button variant="default" size="sm" isLoading>
                  Loading
                </Button>
              </div>

              <div className="pt-2 text-xs text-neutral-500">
                <p>
                  Theme toggle in top-bar switches between Light (warm cream) and Dark (deep charcoal) seamlessly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
