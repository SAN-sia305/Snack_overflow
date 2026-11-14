"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/store/useAuthStore";
import { useNewArrivals, useConsumeSnack, useToggleVote, useUserVotes } from "@/lib/api/hooks";
import { NewArrivalCard } from "@/features/snacks/components/NewArrivalCard";
import { SnackDetailModal } from "@/features/snacks/components/SnackDetailModal";
import { RequestSnackModal } from "@/features/requests/components/RequestSnackModal";
import { Snack } from "@/types";
import { toast } from "@/store/useToastStore";
import { Sparkle, Cookie, Plus } from "@phosphor-icons/react";
import Link from "next/link";

export default function NewArrivalsPage() {
  const currentUser = useCurrentUser();
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const { data: arrivals = [], isLoading } = useNewArrivals();
  const { data: userVotes = [] } = useUserVotes(currentUser.id);

  const consumeMutation = useConsumeSnack();
  const voteMutation = useToggleVote();

  const handleConsume = async (snack: Snack) => {
    try {
      await consumeMutation.mutateAsync({ snackId: snack.id });
      toast.success("Enjoy your snack!", `Consumed 1 packet of ${snack.name}.`);
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && err.code === "STOCK_CONFLICT") {
        toast.conflict("Stock Conflict", "Someone beat you to the last packet. Better luck next time.");
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
      const res = await voteMutation.mutateAsync({ snackId: snack.id, userId: currentUser.id });
      if (res.voted) {
        toast.success("Voted!", `Voted for ${snack.name}. Total: ${res.newCount}`);
      } else {
        toast.info("Vote Removed", `Removed vote for ${snack.name}. Total: ${res.newCount}`);
      }
    } catch (err: unknown) {
      toast.error(
        "Vote Error",
        err instanceof Error ? err.message : "Failed to toggle vote."
      );
    }
  };

  return (
    <AppShell title="New Arrivals">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Sparkle className="w-5 h-5" weight="fill" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
                New Arrivals
              </h1>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Fresh pantry additions in the last 7 days. Try them before they run out!
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRequestModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              <span>Request a Snack</span>
            </Button>
            <Link href="/explore">
              <Button variant="ghost" size="sm" className="text-xs">Explore All</Button>
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : arrivals.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <Cookie className="w-7 h-7" weight="bold" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">No New Arrivals this week</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                When snacks are purchased and added to inventory, they appear here for 7 days!
              </p>
            </div>
            <Button variant="default" size="md" onClick={() => setIsRequestModalOpen(true)} className="text-xs font-semibold">
              Request a Snack Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {arrivals.map((snack) => (
              <NewArrivalCard
                key={snack.id}
                snack={snack}
                onSelect={setSelectedSnack}
                onConsume={handleConsume}
                onVote={handleVote}
                isVoted={userVotes.includes(snack.id)}
                isConsuming={consumeMutation.isPending && consumeMutation.variables?.snackId === snack.id}
              />
            ))}
          </div>
        )}
      </div>

      <SnackDetailModal
        snack={selectedSnack}
        open={!!selectedSnack}
        onOpenChange={(open) => !open && setSelectedSnack(null)}
        onConsume={handleConsume}
        onVote={handleVote}
        isVoted={selectedSnack ? userVotes.includes(selectedSnack.id) : false}
        isConsuming={consumeMutation.isPending && consumeMutation.variables?.snackId === selectedSnack?.id}
        isVoting={voteMutation.isPending && voteMutation.variables?.snackId === selectedSnack?.id}
      />

      <RequestSnackModal open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen} />
    </AppShell>
  );
}
