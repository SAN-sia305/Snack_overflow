"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestSnackModal } from "@/features/requests/components/RequestSnackModal";
import { SnackDetailModal } from "@/features/snacks/components/SnackDetailModal";
import {
  useConsumeSnack,
  useMyRequests,
  useSnack,
  useToggleVote,
  useUserVotes,
} from "@/lib/api/hooks";
import { useCurrentUser } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { MyRequestItem } from "@/lib/mock/services/snackRequestService";
import { ProductRequestStatus, Snack } from "@/types";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
  Sparkle,
  Tray,
  XCircle,
} from "@phosphor-icons/react";

const REQUEST_STEPS: {
  status: Exclude<ProductRequestStatus, "rejected">;
  label: string;
}[] = [
  { status: "requested", label: "Requested" },
  { status: "approved", label: "Approved" },
  { status: "purchased", label: "Purchased" },
  { status: "available", label: "Available" },
];

const STATUS_INDEX: Record<Exclude<ProductRequestStatus, "rejected">, number> = {
  requested: 0,
  approved: 1,
  purchased: 2,
  available: 3,
};

const STATUS_VARIANT: Record<
  ProductRequestStatus,
  "secondary" | "running_low" | "gone" | "stocked"
> = {
  requested: "secondary",
  approved: "running_low",
  rejected: "gone",
  purchased: "running_low",
  available: "stocked",
};

const STATUS_DATE: Record<
  Exclude<ProductRequestStatus, "rejected">,
  (request: MyRequestItem) => string | undefined
> = {
  requested: (request) => request.createdAt,
  approved: (request) => request.reviewedAt,
  purchased: (request) => request.purchasedAt,
  available: (request) => request.availableAt,
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function RequestTimeline({ request }: { request: MyRequestItem }) {
  if (request.status === "rejected") {
    return (
      <div className="space-y-3">
        <ol
          aria-label="Request progress: rejected"
          className="grid grid-cols-2 gap-3 sm:max-w-sm"
        >
          <li className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5 shrink-0" weight="fill" />
            <span>Requested</span>
          </li>
          <li className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <XCircle className="h-5 w-5 shrink-0" weight="fill" />
            <span>Rejected</span>
          </li>
        </ol>
        <p className="text-xs text-rose-700 dark:text-rose-300">
          This request was declined and will not progress to purchasing.
        </p>
        {request.decisionNote && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pantry team note: {request.decisionNote}
          </p>
        )}
      </div>
    );
  }

  const activeIndex = STATUS_INDEX[request.status];

  return (
    <ol
      aria-label={`Request progress: ${request.status}`}
      className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4"
    >
      {REQUEST_STEPS.map((step, index) => {
        const complete = index < activeIndex;
        const current = index === activeIndex;
        const date = index <= activeIndex ? STATUS_DATE[step.status](request) : undefined;

        return (
          <li
            key={step.status}
            aria-current={current ? "step" : undefined}
            className={`flex items-start gap-2 text-xs ${
              current
                ? "font-semibold text-orange-700 dark:text-orange-300"
                : complete
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {complete ? (
              <CheckCircle
                className="h-5 w-5 shrink-0"
                weight="fill"
                aria-hidden="true"
              />
            ) : (
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  current
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/50"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
            )}
            <span>
              <span className="block">{step.label}</span>
              {date && (
                <time
                  className="mt-0.5 block text-[10px] font-normal text-neutral-400"
                  dateTime={date}
                >
                  {formatDate(date)}
                </time>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RequestCard({
  request,
  onViewSnack,
}: {
  request: MyRequestItem;
  onViewSnack: (snackId: string) => void;
}) {
  const availableSnackId =
    request.status === "available" ? request.linkedSnackId : undefined;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[request.status]} className="capitalize">
                {request.status}
              </Badge>
              <span className="text-xs text-neutral-400">
                Submitted {formatDate(request.createdAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {request.productName}
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Expected price: ₹{request.expectedPriceInr}
            </p>
          </div>
          {request.status === "requested" && (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Awaiting pantry team review
            </div>
          )}
        </div>

        {request.note && (
          <div className="rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Your note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
              {request.note}
            </p>
          </div>
        )}

        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <RequestTimeline request={request} />
        </div>

        {availableSnackId && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
            <Sparkle
              className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
              weight="fill"
              aria-hidden="true"
            />
            <p className="flex-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              It&apos;s in the pantry and featured in New Arrivals.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewSnack(availableSnackId)}
            >
              View snack
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Link
              href="/new-arrivals"
              className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
            >
              New Arrivals
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function MyRequestsPage() {
  const currentUser = useCurrentUser();
  const { addToast } = useToastStore();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedSnackId, setSelectedSnackId] = useState<string | null>(null);
  const { data: requests = [], isLoading, isError, refetch } = useMyRequests(currentUser.id);
  const { data: selectedSnack } = useSnack(selectedSnackId ?? "");
  const { data: userVotes = [] } = useUserVotes(currentUser.id);
  const consumeMutation = useConsumeSnack();
  const voteMutation = useToggleVote();

  const handleConsume = async (snack: Snack) => {
    try {
      await consumeMutation.mutateAsync({ snackId: snack.id });
      addToast({
        type: "success",
        title: "Consumed!",
        message: `Enjoyed ${snack.name}! Quantity updated.`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not consume snack.";
      addToast({
        type: message.toLowerCase().includes("beat you") ? "warning" : "error",
        title: message.toLowerCase().includes("beat you") ? "Just missed it!" : "Error",
        message,
      });
    }
  };

  const handleVote = async (snack: Snack) => {
    try {
      const result = await voteMutation.mutateAsync({
        snackId: snack.id,
        userId: currentUser.id,
      });
      addToast({
        type: "success",
        title: result.voted ? "Voted!" : "Vote removed",
        message: result.voted
          ? `Voted for ${snack.name}!`
          : `Vote removed for ${snack.name}.`,
      });
    } catch (error: unknown) {
      addToast({
        type: "error",
        title: "Vote Error",
        message:
          error instanceof Error ? error.message : "Could not register your vote.",
      });
    }
  };

  return (
    <AppShell title="My Requests">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500 p-2.5 text-white shadow-md shadow-blue-500/20">
              <Tray className="h-6 w-6" weight="bold" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                My Snack Requests
              </h1>
              <p className="text-xs text-neutral-500">
                Private status tracking for snacks you have requested.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" weight="bold" aria-hidden="true" />
            Request a snack
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-label="Loading your snack requests">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              We couldn&apos;t load your requests. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Tray className="h-7 w-7" weight="bold" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              No snack requests yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              Request something you&apos;d like to see in the pantry and track its progress here.
            </p>
            <Button
              type="button"
              className="mt-5 gap-1.5"
              onClick={() => setRequestModalOpen(true)}
            >
              <Plus className="h-4 w-4" weight="bold" aria-hidden="true" />
              Request your first snack
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onViewSnack={setSelectedSnackId}
              />
            ))}
          </div>
        )}
      </div>

      <RequestSnackModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
      />
      <SnackDetailModal
        snack={selectedSnack ?? null}
        open={!!selectedSnackId && !!selectedSnack}
        onOpenChange={(open) => {
          if (!open) setSelectedSnackId(null);
        }}
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
    </AppShell>
  );
}
