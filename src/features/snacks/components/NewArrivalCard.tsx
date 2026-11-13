"use client";

import Image from "next/image";
import { Snack } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatus } from "@/lib/mock/store";
import { Sparkle, CalendarBlank, ThumbsUp } from "@phosphor-icons/react";
import { motion } from "framer-motion";

function formatArrivalDate(dateString: string): string {
  try {
    const diffDays = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    if (diffDays === 0) return "Added today";
    if (diffDays === 1) return "Added yesterday";
    return `Added ${diffDays} days ago`;
  } catch {
    return "Recently added";
  }
}

export function NewArrivalCard({
  snack,
  onSelect,
  onConsume,
  onVote,
  isVoted = false,
  isConsuming = false,
}: {
  snack: Snack;
  onSelect?: (snack: Snack) => void;
  onConsume?: (snack: Snack) => void;
  onVote?: (snack: Snack) => void;
  isVoted?: boolean;
  isConsuming?: boolean;
}) {
  const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
  const isGone = status === "gone";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(snack)}
      className="group relative flex flex-col rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/50 transition-all overflow-hidden cursor-pointer text-left"
    >
      {/* Image */}
      <div className="relative w-full aspect-16/10 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <Image
          src={snack.imageUrl}
          alt={snack.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Badge variant="new" className="gap-1 shadow-md">
            <Sparkle className="w-3 h-3" weight="fill" />
            <span>New Arrival</span>
          </Badge>

          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium capitalize">
            {snack.category}
          </span>
        </div>

        {/* Bottom Added Date */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-white/90 text-xs font-medium">
          <CalendarBlank className="w-3.5 h-3.5" />
          <span>{formatArrivalDate(snack.createdAt)}</span>
        </div>

        {snack.priceInr && (
          <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-bold">
            ₹{snack.priceInr}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Badge variant={status} dot>
              {isGone
                ? "Gone"
                : status === "running_low"
                ? `Low (${snack.quantity})`
                : `${snack.quantity} in stock`}
            </Badge>

            <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5 text-neutral-400" />
              <span>{snack.voteCount}</span>
            </span>
          </div>

          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
            {snack.name}
          </h3>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {snack.description}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(snack);
            }}
            className="h-8 px-2 text-xs text-neutral-500"
          >
            <ThumbsUp
              className="w-3.5 h-3.5 mr-1"
              weight={isVoted ? "fill" : "regular"}
            />
            <span>{isVoted ? "Voted" : "Vote"}</span>
          </Button>

          <Button
            variant={isGone ? "outline" : "default"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConsume?.(snack);
            }}
            disabled={isGone}
            isLoading={isConsuming}
            className="h-8 px-3 text-xs font-semibold"
          >
            {isGone ? "Gone" : "Consume"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

