"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useSnacks,
  useSnackOfTheWeek,
  useNewArrivals,
  useMyRequests,
  useConsumeSnack,
  useToggleVote,
  useUserVotes,
} from "@/lib/api/hooks";
import { SnackCard } from "@/features/snacks/components/SnackCard";
import { SnackOfTheWeekCard } from "@/features/snacks/components/SnackOfTheWeekCard";
import { NewArrivalCard } from "@/features/snacks/components/NewArrivalCard";
import { SnackDetailModal } from "@/features/snacks/components/SnackDetailModal";
import { RequestSnackModal } from "@/features/requests/components/RequestSnackModal";
import { Snack, SnackCategory } from "@/types";
import { toast } from "@/store/useToastStore";
import { getStockStatus } from "@/lib/mock/store";
import {
  Sparkle,
  Compass,
  Tray,
  Plus,
  ArrowRight,
  Cookie,
} from "@phosphor-icons/react";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function MemberHomePage() {
  const { currentUser } = useAuthStore();
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SnackCategory | "all">("all");

  const { data: allSnacks = [], isLoading: loadingSnacks } = useSnacks();
  const { data: snackOfTheWeek, isLoading: loadingSotw } = useSnackOfTheWeek();
  const { data: newArrivals = [], isLoading: loadingArrivals } = useNewArrivals();
  const { data: myRequests = [], isLoading: loadingRequests } = useMyRequests(currentUser.id);
  const { data: userVotes = [] } = useUserVotes(currentUser.id);

  const consumeMutation = useConsumeSnack();
  const voteMutation = useToggleVote();

  // Stock summary calculation for Member view
  const stockedCount = allSnacks.filter(
    (s) => getStockStatus(s.quantity, s.lowStockThreshold) === "stocked"
  ).length;
  const runningLowCount = allSnacks.filter(
    (s) => getStockStatus(s.quantity, s.lowStockThreshold) === "running_low"
  ).length;
  const goneCount = allSnacks.filter(
    (s) => getStockStatus(s.quantity, s.lowStockThreshold) === "gone"
  ).length;

  // Filtered snack preview for "Explore the Pantry"
  const explorePreview = allSnacks
    .filter((s) => activeCategory === "all" || s.category === activeCategory)
    .slice(0, 4);

  const handleConsume = async (snack: Snack) => {
    try {
      await consumeMutation.mutateAsync({
        snackId: snack.id,
        user: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      });
      toast.success(
        "Enjoy your snack!",
        `Consumed 1 packet of ${snack.name}. Pantry stock updated.`
      );
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && err.code === "STOCK_CONFLICT") {
        toast.conflict(
          "Stock Conflict",
          "Someone beat you to the last packet. Better luck next time."
        );
      } else {
        toast.error(
          "Consume Error",
          err instanceof Error ? err.message : "Could not consume snack."
        );
      }
    }
  };

  const handleVote = async (snack: Snack) => {
    try {
      const res = await voteMutation.mutateAsync({
        snackId: snack.id,
        userId: currentUser.id,
      });
      if (res.voted) {
        toast.success("Voted!", `You voted for ${snack.name}. Total: ${res.newCount}`);
      } else {
        toast.info("Vote Removed", `Removed vote for ${snack.name}. Total: ${res.newCount}`);
      }
    } catch (err: unknown) {
      toast.error(
        "Vote Error",
        err instanceof Error ? err.message : "Failed to record vote."
      );
    }
  };

  return (
    <AppShell title="Living Pantry">
      <div className="space-y-10 max-w-6xl mx-auto">
        {/* 1. Personal Greeting & Living Pantry Summary */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-600 to-amber-600 p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-orange-500/15">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              <span>Living Pantry • Coimbatore HQ</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              {getTimeGreeting()}, {currentUser.name.split(" ")[0]}!
            </h1>

            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              Ready for a quick energy boost? Check what is available before you
              walk to the pantry.
            </p>

            {/* Compact Pantry Health Summary (Consumer Friendly) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{stockedCount} Fully Stocked</span>
              </span>

              {runningLowCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
                  <span className="w-2 h-2 rounded-full bg-amber-300" />
                  <span>{runningLowCount} Running Low</span>
                </span>
              )}

              {goneCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
                  <span className="w-2 h-2 rounded-full bg-rose-300" />
                  <span>{goneCount} Gone</span>
                </span>
              )}
            </div>
          </div>

          <Cookie
            className="absolute -right-8 -bottom-8 w-60 h-60 text-white/10 pointer-events-none rotate-12"
            weight="fill"
          />
        </div>

        {/* 2. Featured Snack of the Week */}
        <section aria-label="Snack of the Week">
          {loadingSotw ? (
            <Skeleton className="w-full h-72 rounded-3xl" />
          ) : snackOfTheWeek ? (
            <SnackOfTheWeekCard
              snack={snackOfTheWeek}
              onSelect={setSelectedSnack}
              onConsume={handleConsume}
              onVote={handleVote}
              isVoted={userVotes.includes(snackOfTheWeek.id)}
              isConsuming={
                consumeMutation.isPending &&
                consumeMutation.variables?.snackId === snackOfTheWeek.id
              }
              isVoting={
                voteMutation.isPending &&
                voteMutation.variables?.snackId === snackOfTheWeek.id
              }
            />
          ) : null}
        </section>

        {/* 3. New Arrivals Carousel / Grid Preview */}
        {loadingArrivals ? (
          <Skeleton className="h-56 rounded-2xl" />
        ) : newArrivals.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-amber-500" weight="fill" />
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    New Arrivals
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Fresh pantry additions from this week.
                </p>
              </div>

              <Link
                href="/new-arrivals"
                className="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>View all ({newArrivals.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {newArrivals.slice(0, 3).map((snack) => (
                <NewArrivalCard
                  key={snack.id}
                  snack={snack}
                  onSelect={setSelectedSnack}
                  onConsume={handleConsume}
                  onVote={handleVote}
                  isVoted={userVotes.includes(snack.id)}
                  isConsuming={
                    consumeMutation.isPending &&
                    consumeMutation.variables?.snackId === snack.id
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* 4. Explore the Pantry Teaser Section */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-500" weight="bold" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Explore the Pantry
                </h2>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Quick browse snacks by category or see the complete collection.
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "sweet", "savoury", "drink", "healthy-ish"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {loadingSnacks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {explorePreview.map((snack) => (
                <SnackCard
                  key={snack.id}
                  snack={snack}
                  onSelect={setSelectedSnack}
                  onConsume={handleConsume}
                  onVote={handleVote}
                  isVoted={userVotes.includes(snack.id)}
                  isConsuming={
                    consumeMutation.isPending &&
                    consumeMutation.variables?.snackId === snack.id
                  }
                  isVoting={
                    voteMutation.isPending &&
                    voteMutation.variables?.snackId === snack.id
                  }
                />
              ))}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Link href="/explore">
              <Button variant="outline" size="md" className="gap-2 font-semibold">
                <span>Browse Full Pantry Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* 5. Discreet My Requests Preview */}
        <section aria-label="My Requests Preview">
          <Card className="border-neutral-200/80 dark:border-neutral-800/80 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Tray className="w-5 h-5" weight="bold" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    My Snack Requests
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Track your personal snack requests and team restocking progress.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" weight="bold" />
                  <span>Request a Snack</span>
                </Button>

                <Link href="/my-requests">
                  <Button variant="ghost" size="sm" className="text-xs text-neutral-500">
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {loadingRequests ? (
              <Skeleton className="w-full h-16 rounded-xl" />
            ) : myRequests.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-2">
                  You haven&apos;t requested any snacks yet.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="text-xs"
                >
                  Request Your Favorite Treat
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myRequests.slice(0, 2).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {req.productName}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Expected price: ₹{req.expectedPriceInr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          req.status === "available"
                            ? "stocked"
                            : req.status === "approved" || req.status === "purchased"
                            ? "running_low"
                            : req.status === "rejected"
                            ? "gone"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Shared Snack Detail Modal */}
      <SnackDetailModal
        snack={selectedSnack}
        open={!!selectedSnack}
        onOpenChange={(open) => !open && setSelectedSnack(null)}
        onConsume={handleConsume}
        onVote={handleVote}
        isVoted={selectedSnack ? userVotes.includes(selectedSnack.id) : false}
        isConsuming={
          consumeMutation.isPending &&
          consumeMutation.variables?.snackId === selectedSnack?.id
        }
        isVoting={
          voteMutation.isPending &&
          voteMutation.variables?.snackId === selectedSnack?.id
        }
      />

      {/* Request Snack Modal */}
      <RequestSnackModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
      />
    </AppShell>
  );
}
