"use client";

import Image from "next/image";
import { Snack } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatus } from "@/lib/mock/store";
import { ThumbsUp, Star, Cookie, ArrowRight } from "@phosphor-icons/react";

export function SnackOfTheWeekCard({
  snack,
  onSelect,
  onConsume,
  onVote,
  isVoted = false,
  isConsuming = false,
  isVoting = false,
}: {
  snack: Snack;
  onSelect?: (snack: Snack) => void;
  onConsume?: (snack: Snack) => void;
  onVote?: (snack: Snack) => void;
  isVoted?: boolean;
  isConsuming?: boolean;
  isVoting?: boolean;
}) {
  const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
  const isGone = status === "gone";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-200/90 dark:border-orange-900/40 bg-linear-to-br from-amber-50/70 via-orange-50/60 to-rose-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-orange-950/20 shadow-lg shadow-orange-500/5">
      {/* Decorative background cookie outline */}
      <Cookie
        className="absolute -right-8 -bottom-10 w-64 h-64 text-orange-500/5 dark:text-orange-500/5 pointer-events-none rotate-12"
        weight="fill"
      />

      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Image with badges (5 cols) */}
        <div
          onClick={() => onSelect?.(snack)}
          className="md:col-span-5 relative w-full aspect-4/3 md:aspect-square rounded-2xl overflow-hidden shadow-md cursor-pointer group bg-neutral-200"
        >
          <Image
            src={snack.imageUrl}
            alt={snack.name}
            fill
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 360px"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Top category chip */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize shadow-xs">
              {snack.category}
            </span>
          </div>

          {snack.priceInr && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-bold">
              ₹{snack.priceInr}
            </div>
          )}
        </div>

        {/* Right Column: Editorial copy and interactive buttons (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4 text-left">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm shadow-orange-500/30">
                <Star className="w-3.5 h-3.5" weight="fill" />
                <span>Snack of the Week</span>
              </span>

              <Badge variant={status} dot>
                {isGone
                  ? "Gone"
                  : `${snack.quantity} Available`}
              </Badge>
            </div>

            <h2
              onClick={() => onSelect?.(snack)}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              {snack.name}
            </h2>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xl">
              {snack.description}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant={isGone ? "outline" : "default"}
              size="md"
              onClick={() => onConsume?.(snack)}
              disabled={isGone}
              isLoading={isConsuming}
              className="px-5 font-semibold"
            >
              {isGone ? "Currently Gone" : "Consume 1 Packet"}
            </Button>

            <Button
              variant={isVoted ? "accent" : "outline"}
              size="md"
              onClick={() => onVote?.(snack)}
              isLoading={isVoting}
              className="gap-2 font-medium"
            >
              <ThumbsUp
                className="w-4 h-4"
                weight={isVoted ? "fill" : "regular"}
              />
              <span>{isVoted ? "Voted" : "Vote"} ({snack.voteCount})</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect?.(snack)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

