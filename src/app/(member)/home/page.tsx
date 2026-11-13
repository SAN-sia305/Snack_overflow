"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Sparkle, Compass, Tray, Heart } from "@phosphor-icons/react";
import Link from "next/link";

export default function MemberHomePage() {
  const { currentUser } = useAuthStore();

  return (
    <AppShell title="Pantry Home">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="p-8 rounded-3xl bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/15">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
            <Sparkle className="w-3.5 h-3.5" weight="fill" />
            <span>Living Pantry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name.split(" ")[0]}!
          </h1>
          <p className="text-orange-100 text-sm mt-1 max-w-md">
            Check out what is in stock today, explore new arrivals, or request your favorite treat.
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="/explore">
              <Button variant="secondary" size="md" className="bg-white text-orange-600 font-semibold shadow-sm">
                Explore All Snacks
              </Button>
            </Link>
            <Link href="/my-requests">
              <Button variant="outline" size="md" className="border-white/40 text-white hover:bg-white/10">
                My Requests
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-orange-500" />
              <span>Explore Collection</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-3">
              Browse drinks, savouries, sweets, and healthy bites.
            </p>
            <Link href="/explore" className="text-xs font-semibold text-orange-500 hover:underline">
              View Pantry →
            </Link>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-amber-500" />
              <span>New Arrivals</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-3">
              See what recently arrived in the pantry this week.
            </p>
            <Link href="/new-arrivals" className="text-xs font-semibold text-orange-500 hover:underline">
              Check Arrivals →
            </Link>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Tray className="w-5 h-5 text-blue-500" />
              <span>My Requests</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-3">
              Track the approval and purchase status of your requests.
            </p>
            <Link href="/my-requests" className="text-xs font-semibold text-orange-500 hover:underline">
              Track Status →
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

