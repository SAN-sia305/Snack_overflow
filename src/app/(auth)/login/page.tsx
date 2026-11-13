"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { toast } from "@/store/useToastStore";
import {
  Cookie,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkle,
  LockKey,
  Envelope,
  Info,
} from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, loginWithEmail } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<"admin" | "member">("member");
  const [email, setEmail] = useState("member@bipolarfactory.com");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (role: "admin" | "member") => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("admin@bipolarfactory.com");
      setPassword("demo123");
    } else {
      setEmail("member@bipolarfactory.com");
      setPassword("demo123");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      loginWithEmail(email);
      setIsLoading(false);

      if (email.toLowerCase().includes("admin") || selectedRole === "admin") {
        toast.success(
          "Signed in as Admin",
          "Welcome to the Pantry Lead Dashboard, Arun."
        );
        router.push("/dashboard");
      } else {
        toast.success(
          "Signed in as Member",
          "Welcome to the Living Pantry, Priya."
        );
        router.push("/home");
      }
    }, 400);
  };

  const handleQuickLogin = (role: "admin" | "member") => {
    setIsLoading(true);
    loginAs(role);

    setTimeout(() => {
      setIsLoading(false);
      if (role === "admin") {
        toast.success("Signed in as Admin", "Pantry operations loaded.");
        router.push("/dashboard");
      } else {
        toast.success("Signed in as Member", "Pantry discovery loaded.");
        router.push("/home");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-neutral-50/60 dark:bg-neutral-950 transition-colors">
      {/* Top bar with logo and theme toggle */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25">
            <Cookie className="w-5 h-5" weight="fill" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Snack Overflow
            </span>
            <span className="block text-[10px] text-neutral-400 font-medium">
              Bipolar Factory Pantry
            </span>
          </div>
        </div>

        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Branding Banner (5 cols on lg) */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-600 to-amber-600 p-8 sm:p-10 text-white shadow-2xl shadow-orange-500/20 flex flex-col justify-between min-h-[380px] lg:min-h-[540px]">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>Office Pantry System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Good snacks.
              <br />
              Great office energy.
            </h1>

            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Discover what is fresh in the pantry, grab your favorite bite, vote
              for what you love, and request what we are missing.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/20 text-xs text-orange-100 space-y-1">
            <p className="font-semibold text-white">Bipolar Factory — Coimbatore HQ</p>
            <p className="text-[11px] opacity-80">Never run out. Always transparent.</p>
          </div>

          <Cookie
            className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 pointer-events-none rotate-12"
            weight="fill"
          />
        </div>

        {/* Right Authentication & Role Cards (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="text-left space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Welcome back
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select a demo role below to explore the application.
            </p>
          </div>

          {/* Role Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Member Demo Card */}
            <div
              onClick={() => handleSelectRole("member")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                selectedRole === "member"
                  ? "border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <User className="w-4 h-4" weight="bold" />
                  </div>
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Member Role
                  </span>
                </div>
                <Badge variant="member">Priya Sharma</Badge>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                Explore pantry snacks, consume stock, vote, and request items privately.
              </p>
              <div className="text-[11px] font-mono text-neutral-400">
                member@bipolarfactory.com
              </div>
            </div>

            {/* Admin Demo Card */}
            <div
              onClick={() => handleSelectRole("admin")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                selectedRole === "admin"
                  ? "border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-sm"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" weight="fill" />
                  </div>
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Admin Role
                  </span>
                </div>
                <Badge variant="admin">Arun Kumar</Badge>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                Full inventory controls, smart restock alerts, demand review, and activity log.
              </p>
              <div className="text-[11px] font-mono text-neutral-400">
                admin@bipolarfactory.com
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 text-left">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startIcon={<Envelope className="w-4 h-4" />}
                  placeholder="name@bipolarfactory.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Demo Password
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    (Any password works in demo)
                  </span>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startIcon={<LockKey className="w-4 h-4" />}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                variant="default"
                size="lg"
                isLoading={isLoading}
                className="flex-1 gap-2 font-semibold"
              >
                <span>Enter as {selectedRole === "admin" ? "Admin" : "Member"}</span>
                <ArrowRight className="w-4 h-4" weight="bold" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() =>
                  handleQuickLogin(selectedRole === "admin" ? "member" : "admin")
                }
                className="font-medium"
              >
                Switch & Enter as {selectedRole === "admin" ? "Member" : "Admin"}
              </Button>
            </div>
          </form>

          {/* Demo Disclaimer notice */}
          <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-start gap-2.5 text-left">
            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" weight="bold" />
            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                Phase 1 Simulation:
              </span>{" "}
              This is an interactive evaluation prototype powered by realistic
              mock services. No credentials or session cookies are sent over the network.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

