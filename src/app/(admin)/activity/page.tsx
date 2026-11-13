"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminActivities, useSnacks } from "@/lib/api/hooks";
import { ActivityAction } from "@/types";
import {
  ArrowRight,
  ClockCounterClockwise,
  Coffee,
  Package,
  Tray,
} from "@phosphor-icons/react";

const ACTION_FILTERS: { value: ActivityAction | "all"; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "consumed", label: "Consumption" },
  { value: "restocked", label: "Restocking" },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminActivityPage() {
  const [action, setAction] = useState<ActivityAction | "all">("all");
  const [snackId, setSnackId] = useState("all");
  const activitiesQuery = useAdminActivities({
    action,
    snackId: snackId === "all" ? undefined : snackId,
  });
  const snacksQuery = useSnacks({ sortBy: "name-asc" });
  const activities = activitiesQuery.data ?? [];
  const dateGroups = activities.reduce<
    { date: string; items: typeof activities }[]
  >((groups, item) => {
    const date = formatDate(item.createdAt);
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ date, items: [item] });
    }
    return groups;
  }, []);

  return (
    <AppShell title="Activity Log">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-neutral-800 p-2.5 text-white shadow-md dark:bg-neutral-700">
              <ClockCounterClockwise
                className="h-6 w-6"
                weight="bold"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Pantry activity log
              </h1>
              <p className="text-xs text-neutral-500">
                Consumption and restocking history for pantry operations.
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
          >
            Manage inventory
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>

        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Activity type
            <select
              value={action}
              onChange={(event) =>
                setAction(event.target.value as ActivityAction | "all")
              }
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {ACTION_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Snack
            <select
              value={snackId}
              onChange={(event) => setSnackId(event.target.value)}
              disabled={snacksQuery.isLoading || snacksQuery.isError}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <option value="all">All snacks</option>
              {(snacksQuery.data ?? []).map((snack) => (
                <option key={snack.id} value={snack.id}>
                  {snack.name}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {activitiesQuery.isLoading
              ? "Loading activity…"
              : `${activities.length} entr${activities.length === 1 ? "y" : "ies"}`}
          </span>
          {(action !== "all" || snackId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAction("all");
                setSnackId("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {activitiesQuery.isLoading ? (
          <div className="space-y-3" aria-label="Loading pantry activity">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : activitiesQuery.isError ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              We couldn&apos;t load pantry activity. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void activitiesQuery.refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : activities.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <Tray
              className="mb-3 h-8 w-8 text-neutral-400"
              aria-hidden="true"
            />
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
              No matching activity
            </h2>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              {action === "all" && snackId === "all"
                ? "Consumption and restocking events will appear here as the pantry is used."
                : "Try another activity type or snack filter."}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <section key={group.date} aria-label={group.date}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-400">
                  {group.date}
                </h2>
                <Card className="divide-y divide-neutral-100 px-4 dark:divide-neutral-800 sm:px-5">
                  {group.items.map((item) => {
                    const restocked = item.action === "restocked";
                    const Icon = restocked ? Package : Coffee;
                    return (
                      <article
                        key={item.id}
                        className="flex flex-col gap-3 py-4 first:pt-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-xl p-2.5 ${
                              restocked
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"
                            }`}
                          >
                            <Icon
                              className="h-4 w-4"
                              weight="bold"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-neutral-800 dark:text-neutral-200">
                              <span className="font-semibold">{item.userName}</span>{" "}
                              {restocked ? "restocked" : "consumed"}{" "}
                              <span className="font-semibold">{item.snackName}</span>
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {restocked ? "Added" : "Consumed"} {item.amount}{" "}
                              {item.amount === 1 ? "packet" : "packets"}
                            </p>
                            {item.note && (
                              <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-300">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <time
                          dateTime={item.createdAt}
                          className="pl-12 text-xs text-neutral-400 sm:pl-0"
                        >
                          {formatTime(item.createdAt)}
                        </time>
                      </article>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
