"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SnackCard } from "@/features/snacks/components/SnackCard";
import { SnackDetailModal } from "@/features/snacks/components/SnackDetailModal";
import { RequestSnackModal } from "@/features/requests/components/RequestSnackModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useSnacks,
  useSnack,
  useUserVotes,
  useConsumeSnack,
  useToggleVote,
} from "@/lib/api/hooks";
import { useCurrentUser } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { Snack, SnackCategory, SnackStatus } from "@/types";
import type { GetSnacksParams } from "@/lib/api/snacks";
import {
  MagnifyingGlass,
  Compass,
  Funnel,
  X,
  ArrowsDownUp,
  Smiley,
  Cookie,
  Coffee,
  Leaf,
  Aperture,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortOption = NonNullable<GetSnacksParams["sortBy"]>;

interface FilterState {
  search: string;
  category: SnackCategory | "all";
  status: SnackStatus | "all";
  sortBy: SortOption;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CHIPS: { label: string; value: SnackCategory | "all"; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <Aperture className="w-3.5 h-3.5" weight="bold" /> },
  { label: "Sweet", value: "sweet", icon: <Cookie className="w-3.5 h-3.5" weight="bold" /> },
  { label: "Savoury", value: "savoury", icon: <Smiley className="w-3.5 h-3.5" weight="bold" /> },
  { label: "Drink", value: "drink", icon: <Coffee className="w-3.5 h-3.5" weight="bold" /> },
  { label: "Healthy-ish", value: "healthy-ish", icon: <Leaf className="w-3.5 h-3.5" weight="bold" /> },
];

const STATUS_CHIPS: { label: string; value: SnackStatus | "all"; badgeVariant: string }[] = [
  { label: "Any Stock", value: "all", badgeVariant: "secondary" },
  { label: "Stocked", value: "stocked", badgeVariant: "stocked" },
  { label: "Running Low", value: "running_low", badgeVariant: "running_low" },
  { label: "Gone", value: "gone", badgeVariant: "gone" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Most Voted", value: "votes-desc" },
  { label: "Name A–Z", value: "name-asc" },
  { label: "Newest First", value: "newest" },
  { label: "Quantity ↑", value: "quantity-asc" },
];

const INITIAL_FILTERS: FilterState = {
  search: "",
  category: "all",
  status: "all",
  sortBy: "votes-desc",
};

// ─── Skeleton Grid ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          <Skeleton className="w-full aspect-4/3" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="pt-2 flex justify-between">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-5"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <Compass className="w-8 h-8 text-neutral-400" weight="thin" />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          {hasFilters ? "No snacks match your filters" : "No snacks in the pantry yet"}
        </p>
        <p className="text-sm text-neutral-500 max-w-xs">
          {hasFilters
            ? "Try different search terms or clear your filters to see everything."
            : "Check back once the pantry leads add some snacks!"}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <X className="w-3.5 h-3.5" />
          Clear All Filters
        </Button>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const user = useCurrentUser();
  const { addToast } = useToastStore();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ─── Queries ───────────────────────────────────────────────────────────────

  const queryParams: GetSnacksParams = {
    search: debouncedSearch || undefined,
    category: filters.category !== "all" ? filters.category : undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    sortBy: filters.sortBy,
  };

  const {
    data: snacks,
    isLoading,
    isError,
    refetch,
  } = useSnacks(queryParams);
  const { data: selectedSnackData } = useSnack(selectedSnack?.id ?? "");
  const { data: userVotes = [] } = useUserVotes(user?.id ?? "");

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const consumeMutation = useConsumeSnack();
  const voteMutation = useToggleVote();
  const displayedSnack =
    selectedSnackData === undefined ? selectedSnack : selectedSnackData;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 350);
  }, []);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    startTransition(() => {
      setFilters((f) => ({ ...f, [key]: value }));
    });
  };

  const resetFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setFilters(INITIAL_FILTERS);
    setDebouncedSearch("");
  };

  const clearSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setFilters((f) => ({ ...f, search: "" }));
    setDebouncedSearch("");
  };

  const handleConsume = useCallback(async (snack: Snack) => {
    if (!user) return;
    setConsumingId(snack.id);
    try {
      await consumeMutation.mutateAsync({ snackId: snack.id });
      addToast({ type: "success", title: "Consumed!", message: `Enjoyed ${snack.name}! Quantity updated.` });
      // Update modal snack if open
      if (selectedSnack?.id === snack.id) {
        setDetailOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not consume snack.";
      const isConflict = msg.toLowerCase().includes("beat you");
      addToast({
        type: isConflict ? "warning" : "error",
        title: isConflict ? "Just missed it!" : "Error",
        message: isConflict
          ? "Someone beat you to the last packet. Better luck next time."
          : msg,
      });
    } finally {
      setConsumingId(null);
    }
  }, [user, consumeMutation, addToast, selectedSnack]);

  const handleVote = useCallback(async (snack: Snack) => {
    if (!user) return;
    setVotingId(snack.id);
    try {
      const result = await voteMutation.mutateAsync({ snackId: snack.id, userId: user.id });
      addToast({
        type: "success",
        title: result.voted ? "Voted!" : "Vote removed",
        message: result.voted ? `Voted for ${snack.name}!` : `Vote removed for ${snack.name}.`,
      });
    } catch {
      addToast({ type: "error", title: "Error", message: "Could not register your vote." });
    } finally {
      setVotingId(null);
    }
  }, [user, voteMutation, addToast]);

  const openDetail = (snack: Snack) => {
    setSelectedSnack(snack);
    setDetailOpen(true);
  };

  const openRequest = () => {
    setDetailOpen(false);
    setRequestOpen(true);
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.sortBy !== "votes-desc";

  const activeFilterCount = [
    filters.search !== "",
    filters.category !== "all",
    filters.status !== "all",
    filters.sortBy !== "votes-desc",
  ].filter(Boolean).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell title="Explore Snacks">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
            <Compass className="w-6 h-6" weight="bold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Explore Pantry
            </h1>
            <p className="text-xs text-neutral-500">
              Browse, search, and consume all snacks in the office pantry.
            </p>
          </div>
        </div>

        {/* ── Search + Sort Row ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search by name or description…"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-neutral-900"
            />
            {filters.search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex items-center gap-2 sm:w-auto">
            <ArrowsDownUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value as SortOption)}
              className="pl-9 pr-8 h-10 w-full sm:w-48 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
              aria-label="Sort snacks"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Filter Chips ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Category Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide mr-1">
              <Funnel className="w-3.5 h-3.5 inline mr-1" weight="bold" />
              Category
            </span>
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => updateFilter("category", chip.value)}
                aria-pressed={filters.category === chip.value}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  filters.category === chip.value
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                {chip.icon}
                {chip.label}
              </button>
            ))}
          </div>

          {/* Stock Status Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide mr-1">
              Stock
            </span>
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => updateFilter("status", chip.value)}
                aria-pressed={filters.status === chip.value}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  filters.status === chip.value
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Active Filter Summary + Clear */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap pt-1"
              >
                <span className="text-xs text-neutral-500">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
                </span>
                {filters.search && (
                  <Badge variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5">
                    &ldquo;{filters.search}&rdquo;
                    <button
                      onClick={clearSearch}
                      className="ml-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.category !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5 capitalize">
                    {filters.category}
                    <button
                      onClick={() => updateFilter("category", "all")}
                      className="ml-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                      aria-label="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5 capitalize">
                    {filters.status.replace("_", " ")}
                    <button
                      onClick={() => updateFilter("status", "all")}
                      className="ml-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                      aria-label="Remove status filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Results Count ───────────────────────────────────────────────── */}
        {!isLoading && snacks && (
          <p className="text-sm text-neutral-500">
            {snacks.length === 0
              ? "No snacks found"
              : `${snacks.length} snack${snacks.length !== 1 ? "s" : ""} found`}
          </p>
        )}

        {/* ── Snack Grid ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900/50 dark:bg-rose-950/20"
          >
            <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
              We couldn&apos;t load the pantry. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : !snacks || snacks.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {snacks.map((snack) => (
                <motion.div
                  key={snack.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <SnackCard
                    snack={snack}
                    onSelect={openDetail}
                    onConsume={handleConsume}
                    onVote={handleVote}
                    isVoted={userVotes.includes(snack.id)}
                    isConsuming={consumingId === snack.id}
                    isVoting={votingId === snack.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Snack Detail Modal ─────────────────────────────────────────────── */}
      <SnackDetailModal
        snack={displayedSnack}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onConsume={handleConsume}
        onVote={handleVote}
        onRequestSnack={openRequest}
        isVoted={displayedSnack ? userVotes.includes(displayedSnack.id) : false}
        isConsuming={displayedSnack ? consumingId === displayedSnack.id : false}
        isVoting={displayedSnack ? votingId === displayedSnack.id : false}
      />

      {/* ── Request Snack Modal ────────────────────────────────────────────── */}
      <RequestSnackModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
    </AppShell>
  );
}
