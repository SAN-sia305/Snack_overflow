"use client";

import Image from "next/image";
import { Snack } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockStatus } from "@/lib/mock/store";
import { ThumbsUp, Sparkle, Eye } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export interface SnackCardProps {
  snack: Snack;
  onSelect?: (snack: Snack) => void;
  onConsume?: (snack: Snack) => void;
  onVote?: (snack: Snack) => void;
  isVoted?: boolean;
  isConsuming?: boolean;
  isVoting?: boolean;
}

export function SnackCard({
  snack,
  onSelect,
  onConsume,
  onVote,
  isVoted = false,
  isConsuming = false,
  isVoting = false,
}: SnackCardProps) {
  const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
  const isGone = status === "gone";
  const isLow = status === "running_low";

  const isNewArrival =
    snack.arrivalUntil && new Date(snack.arrivalUntil).getTime() > Date.now();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col rounded-2xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white/90 dark:bg-neutral-900/90 shadow-xs hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/40 transition-all overflow-hidden text-left"
    >
      {/* Top Image Container */}
      <div
        onClick={() => onSelect?.(snack)}
        className="relative w-full aspect-4/3 bg-neutral-100 dark:bg-neutral-800 cursor-pointer overflow-hidden"
      >
        <Image
          src={snack.imageUrl}
          alt={snack.name}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            isGone ? "grayscale opacity-60" : ""
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient Overlay for badges */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge variant="secondary" className="backdrop-blur-md bg-white/85 dark:bg-neutral-900/85 text-[11px] font-semibold capitalize">
            {snack.category}
          </Badge>

          {isNewArrival && (
            <Badge variant="new" className="gap-1 animate-in fade-in duration-200">
              <Sparkle className="w-3 h-3" weight="fill" />
              <span>New</span>
            </Badge>
          )}
        </div>

        {/* Quick View Hover Pill on Desktop */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/20 backdrop-blur-2xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-md">
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </span>
        </div>

        {/* Bottom Price in Image */}
        {snack.priceInr && (
          <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold tracking-tight">
            ₹{snack.priceInr}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant={status} dot>
              {isGone
                ? "Gone"
                : isLow
                ? `Running Low (${snack.quantity} left)`
                : `${snack.quantity} in stock`}
            </Badge>
          </div>

          <h3
            onClick={() => onSelect?.(snack)}
            className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 cursor-pointer"
          >
            {snack.name}
          </h3>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {snack.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
          {/* Vote Button */}
          <Button
            variant={isVoted ? "accent" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(snack);
            }}
            isLoading={isVoting}
            className="h-8 px-2.5 text-xs gap-1.5 font-medium"
            title={isVoted ? "Remove your vote" : "Vote for this snack"}
          >
            <ThumbsUp
              className="w-3.5 h-3.5"
              weight={isVoted ? "fill" : "bold"}
            />
            <span>{snack.voteCount}</span>
          </Button>

          {/* Consume Action */}
          <Button
            variant={isGone ? "outline" : "default"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConsume?.(snack);
            }}
            disabled={isGone}
            isLoading={isConsuming}
            className={`h-8 px-3 text-xs font-semibold ${
              isGone ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isGone ? "Gone" : "Consume"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

