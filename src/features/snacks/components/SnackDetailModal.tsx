"use client";

import Image from "next/image";
import { Snack } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatus } from "@/lib/domain/stock";
import { ThumbsUp, Sparkle, WarningCircle, PlusCircle } from "@phosphor-icons/react";

export function SnackDetailModal({
  snack,
  open,
  onOpenChange,
  onConsume,
  onVote,
  onRequestSnack,
  isVoted = false,
  isConsuming = false,
  isVoting = false,
}: {
  snack: Snack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsume?: (snack: Snack) => void;
  onVote?: (snack: Snack) => void;
  onRequestSnack?: () => void;
  isVoted?: boolean;
  isConsuming?: boolean;
  isVoting?: boolean;
}) {
  if (!snack) return null;

  const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
  const isGone = status === "gone";
  const isLow = status === "running_low";
  const isNew = snack.arrivalUntil && new Date(snack.arrivalUntil).getTime() > Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg p-0 overflow-hidden">
        {/* Modal Image */}
        <div className="relative w-full aspect-16/9 bg-neutral-100 dark:bg-neutral-800">
          <Image
            src={snack.imageUrl}
            alt={snack.name}
            fill
            className={`object-cover ${isGone ? "grayscale opacity-70" : ""}`}
            sizes="512px"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges in Image */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold capitalize">
              {snack.category}
            </span>
            {isNew && (
              <Badge variant="new" className="gap-1 shadow-md">
                <Sparkle className="w-3 h-3" weight="fill" />
                <span>New Arrival</span>
              </Badge>
            )}
          </div>

          {snack.priceInr && (
            <div className="absolute bottom-3 right-4 px-3 py-1 rounded-lg bg-orange-600 text-white text-sm font-extrabold shadow-md">
              ₹{snack.priceInr}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-left">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <Badge variant={status} dot>
                {isGone
                  ? "Currently Gone"
                  : isLow
                  ? `Running Low (${snack.quantity} packets left)`
                  : `${snack.quantity} packets available`}
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
              {snack.name}
            </h2>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mt-2.5">
              {snack.description}
            </p>
          </div>

          {/* Out of Stock Notice */}
          {isGone && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <WarningCircle className="w-4 h-4 shrink-0 mt-0.5" weight="bold" />
              <span>
                This snack is completely out of stock. You can still vote to signal interest to the pantry leads!
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
            <Button
              variant={isVoted ? "accent" : "outline"}
              size="md"
              onClick={() => onVote?.(snack)}
              isLoading={isVoting}
              className="gap-2 font-medium"
            >
              <ThumbsUp className="w-4 h-4" weight={isVoted ? "fill" : "regular"} />
              <span>{isVoted ? "Voted" : "Vote"} ({snack.voteCount})</span>
            </Button>

            <Button
              variant={isGone ? "secondary" : "default"}
              size="md"
              onClick={() => onConsume?.(snack)}
              disabled={isGone}
              isLoading={isConsuming}
              className="px-6 font-semibold"
            >
              {isGone ? "Gone" : "Consume 1 Packet"}
            </Button>
          </div>

          {/* Request CTA */}
          {onRequestSnack && (
            <div className="pt-1 text-center">
              <button
                onClick={onRequestSnack}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" weight="bold" />
                Can&apos;t find what you want? Request a snack
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
