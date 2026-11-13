"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import {
  useSnacks,
  useSnackOfTheWeek,
  useAdminSummary,
  useConsumeSnack,
  useToggleVote,
  useUserVotes,
} from "@/lib/api/hooks";
import {
  Sparkle,
  Cookie,
  Fire,
  Heart,
  ThumbsUp,
  Package,
  ArrowsClockwise,
  WarningCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { getStockStatus } from "@/lib/mock/store";

export default function Home() {
  const { currentUser, switchRole } = useAuthStore();
  const { data: snacks, isLoading: loadingSnacks } = useSnacks();
  const { data: snackOfTheWeek } = useSnackOfTheWeek();
  const { data: summary } = useAdminSummary();
  const { data: userVotes = [] } = useUserVotes(currentUser.id);

  const consumeMutation = useConsumeSnack();
  const voteMutation = useToggleVote();

  const handleConsume = async (snackId: string, snackName: string) => {
    try {
      await consumeMutation.mutateAsync({
        snackId,
        user: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      });
      toast.success(
        "Snack Consumed!",
        `You enjoyed 1 packet of ${snackName}. Stock updated.`
      );
    } catch (err: any) {
      if (err.code === "STOCK_CONFLICT") {
        toast.conflict(
          "Stock Conflict",
          "Someone beat you to the last packet. Better luck next time."
        );
      } else {
        toast.error("Consume Failed", err.message || "An error occurred.");
      }
    }
  };

  const handleVote = async (snackId: string) => {
    try {
      const res = await voteMutation.mutateAsync({ snackId, userId: currentUser.id });
      if (res.voted) {
        toast.success("Vote Recorded!", `You voted for this snack. Total votes: ${res.newCount}`);
      } else {
        toast.info("Vote Removed", `Removed your vote. Total votes: ${res.newCount}`);
      }
    } catch (err: any) {
      toast.error("Vote Error", err.message || "Failed to toggle vote.");
    }
  };

  return (
    <AppShell title="Service Layer & Data Verification">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-600 to-amber-600 p-8 md:p-10 text-white shadow-xl shadow-orange-500/15">
          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>Step 2 Live: Mock API & Query Layer Active</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Good snacks.
              <br />
              Great office energy.
            </h1>
            <p className="text-orange-100 text-sm md:text-base leading-relaxed">
              Evaluating as{" "}
              <span className="font-bold underline decoration-white/50 capitalize">
                {currentUser.name} ({currentUser.role})
              </span>
              . Connected to TanStack Query + asynchronous mock service layer with
              simulated latency & concurrency conflicts.
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
            </div>
          </div>

          <Cookie
            className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 pointer-events-none rotate-12"
            weight="fill"
          />
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Snacks</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {summary ? summary.totalSnacks : "..."}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">
              {summary ? `${summary.stockedCount} Stocked` : ""}
            </span>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-neutral-500">Running Low</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {summary ? summary.runningLowCount : "..."}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">Needs attention</span>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-neutral-500">Gone (Zero Stock)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {summary ? summary.goneCount : "..."}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">Ready for restock</span>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-neutral-500">Pending Requests</span>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {summary ? summary.pendingRequestsCount : "..."}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">Awaiting admin review</span>
          </Card>
        </div>

        {/* Snack of the Week Live Showcase */}
        {snackOfTheWeek && (
          <Card className="overflow-hidden border-orange-200/80 dark:border-orange-950/60 shadow-md">
            <div className="p-6 bg-linear-to-r from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-neutral-900 border-b border-orange-100 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
                    <Fire className="w-6 h-6" weight="fill" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 text-[11px] font-bold">
                      ⭐ Featured Snack of the Week
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {snackOfTheWeek.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getStockStatus(snackOfTheWeek.quantity, snackOfTheWeek.lowStockThreshold)} dot>
                    {snackOfTheWeek.quantity} units left
                  </Badge>
                  <Button
                    variant={userVotes.includes(snackOfTheWeek.id) ? "accent" : "outline"}
                    size="sm"
                    onClick={() => handleVote(snackOfTheWeek.id)}
                    isLoading={voteMutation.isPending}
                    className="gap-1.5"
                  >
                    <ThumbsUp
                      className="w-4 h-4"
                      weight={userVotes.includes(snackOfTheWeek.id) ? "fill" : "regular"}
                    />
                    <span>{snackOfTheWeek.voteCount} Votes</span>
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-full md:w-48 h-36 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
                  <Image
                    src={snackOfTheWeek.imageUrl}
                    alt={snackOfTheWeek.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 192px"
                  />
                </div>
                <div className="flex-1 space-y-2 text-left">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {snackOfTheWeek.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConsume(snackOfTheWeek.id, snackOfTheWeek.name)}
                      disabled={snackOfTheWeek.quantity <= 0}
                      isLoading={consumeMutation.isPending}
                    >
                      {snackOfTheWeek.quantity > 0 ? "Consume 1 Packet" : "Out of Stock"}
                    </Button>
                    <span className="text-xs text-neutral-400">
                      ₹{snackOfTheWeek.priceInr || 30} • Category: {snackOfTheWeek.category}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Inventory Preview with Interactive Consume/Conflict test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" weight="fill" />
                  <span>Interactive Mock Pantry Sample</span>
                </CardTitle>
                <CardDescription>
                  Try consuming items. Notice how items with 0 stock trigger realistic conflict messages!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSnacks ? (
              <p className="text-sm text-neutral-400 py-4">Loading pantry mock data...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(snacks || []).slice(0, 6).map((snack) => {
                  const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
                  const isVoted = userVotes.includes(snack.id);

                  return (
                    <div
                      key={snack.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                          <Image
                            src={snack.imageUrl}
                            alt={snack.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {snack.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant={status} dot>
                              {status === "gone"
                                ? "Gone"
                                : status === "running_low"
                                ? `Low (${snack.quantity})`
                                : `${snack.quantity} in stock`}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(snack.id)}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <ThumbsUp
                            className="w-3.5 h-3.5"
                            weight={isVoted ? "fill" : "regular"}
                          />
                          <span>{snack.voteCount}</span>
                        </Button>

                        <Button
                          variant={snack.quantity > 0 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleConsume(snack.id, snack.name)}
                          isLoading={consumeMutation.isPending && consumeMutation.variables?.snackId === snack.id}
                          className="h-8 text-xs"
                        >
                          {snack.quantity > 0 ? "Consume" : "Try Consume (Gone)"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
