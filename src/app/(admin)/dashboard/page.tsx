"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminActivities,
  useAdminAlerts,
  useAdminSummary,
  useProductRequests,
} from "@/lib/api/hooks";
import { useCurrentUser } from "@/store/useAuthStore";
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  CheckCircle,
  ClockCounterClockwise,
  Package,
  Plus,
  ShoppingCart,
  WarningCircle,
} from "@phosphor-icons/react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  isLoading,
}: {
  label: string;
  value?: number;
  detail: string;
  icon: typeof Package;
  tone: "orange" | "green" | "amber" | "rose" | "blue";
  isLoading: boolean;
}) {
  const tones = {
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {value ?? "—"}
            </p>
          )}
          <p className="mt-1 text-[11px] text-neutral-400">{detail}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" weight="bold" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

function PanelError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <p role="alert" className="text-xs text-rose-800 dark:text-rose-300">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const currentUser = useCurrentUser();
  const summaryQuery = useAdminSummary();
  const alertsQuery = useAdminAlerts();
  const requestsQuery = useProductRequests("requested");
  const activitiesQuery = useAdminActivities({ limit: 5 });

  const summary = summaryQuery.data;
  const alerts = alertsQuery.data;
  const pendingRequests = requestsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const healthTotal = summary
    ? summary.stockedCount + summary.runningLowCount + summary.goneCount
    : 0;
  const healthSegments = summary && healthTotal > 0
    ? [
        {
          label: "Stocked",
          count: summary.stockedCount,
          color: "bg-emerald-500",
          text: "text-emerald-700 dark:text-emerald-400",
        },
        {
          label: "Running low",
          count: summary.runningLowCount,
          color: "bg-amber-500",
          text: "text-amber-700 dark:text-amber-400",
        },
        {
          label: "Gone",
          count: summary.goneCount,
          color: "bg-rose-500",
          text: "text-rose-700 dark:text-rose-400",
        },
      ]
    : [];

  return (
    <AppShell title="Admin Operations Dashboard">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {getGreeting()}, {currentUser.name.split(" ")[0]}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Pantry operations
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              A quick read on pantry health and what needs your attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/inventory?action=add">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" weight="bold" aria-hidden="true" />
                Add snack
              </Button>
            </Link>
            <Link href="/requests">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Review requests
              </Button>
            </Link>
          </div>
        </header>

        <section aria-label="Pantry summary">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Pantry at a glance
            </h2>
            {summaryQuery.isError && (
              <span className="text-xs text-rose-600 dark:text-rose-400">
                Summary unavailable
              </span>
            )}
          </div>
          {summaryQuery.isError ? (
            <PanelError
              message="We couldn't load pantry totals."
              onRetry={() => void summaryQuery.refetch()}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricCard
                label="Total snacks"
                value={summary?.totalSnacks}
                detail="In pantry"
                icon={Package}
                tone="orange"
                isLoading={summaryQuery.isLoading}
              />
              <MetricCard
                label="Stocked"
                value={summary?.stockedCount}
                detail="Above threshold"
                icon={CheckCircle}
                tone="green"
                isLoading={summaryQuery.isLoading}
              />
              <MetricCard
                label="Running low"
                value={summary?.runningLowCount}
                detail="Restock soon"
                icon={ArrowDownRight}
                tone="amber"
                isLoading={summaryQuery.isLoading}
              />
              <MetricCard
                label="Gone"
                value={summary?.goneCount}
                detail="Out of stock"
                icon={WarningCircle}
                tone="rose"
                isLoading={summaryQuery.isLoading}
              />
              <MetricCard
                label="Pending requests"
                value={summary?.pendingRequestsCount}
                detail="Product groups to review"
                icon={Bell}
                tone="blue"
                isLoading={summaryQuery.isLoading}
              />
            </div>
          )}
        </section>

        <section aria-label="Smart alerts">
          <div className="mb-3 flex items-center gap-2">
            <Bell
              className="h-4 w-4 text-orange-500"
              weight="fill"
              aria-hidden="true"
            />
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Smart alerts
            </h2>
          </div>
          {alertsQuery.isError ? (
            <PanelError
              message="We couldn't load pantry alerts."
              onRetry={() => void alertsQuery.refetch()}
            />
          ) : alertsQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-rose-200/80 p-5 dark:border-rose-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                      <WarningCircle
                        className="h-5 w-5"
                        weight="fill"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Low-stock alert
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {alerts?.lowStockAlert.count ?? 0} snack
                        {(alerts?.lowStockAlert.count ?? 0) === 1 ? "" : "s"} need
                        attention
                      </p>
                    </div>
                  </div>
                  <Badge variant="gone">
                    {alerts?.lowStockAlert.count ?? 0}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {(alerts?.lowStockAlert.items ?? []).length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      All stocked items are above their low-stock threshold.
                    </p>
                  ) : (
                    alerts?.lowStockAlert.items.map((snack) => (
                      <div
                        key={snack.id}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                          {snack.name}
                        </span>
                        <span className="shrink-0 text-rose-700 dark:text-rose-300">
                          {snack.quantity} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/inventory?status=running_low"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline dark:text-rose-300"
                >
                  Review inventory
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Card>

              <Card className="border-amber-200/80 p-5 dark:border-amber-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                      <Bell
                        className="h-5 w-5"
                        weight="fill"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        New snack requests
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {alerts?.pendingRequestsAlert.count ?? 0} product
                        {(alerts?.pendingRequestsAlert.count ?? 0) === 1 ? "" : "s"} await
                        review
                      </p>
                    </div>
                  </div>
                  <Badge variant="running_low">
                    {alerts?.pendingRequestsAlert.count ?? 0}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {(alerts?.pendingRequestsAlert.items ?? []).length === 0 ? (
                    <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-800/50">
                      No pending product requests right now.
                    </p>
                  ) : (
                    alerts?.pendingRequestsAlert.items.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                          {request.productName}
                        </span>
                        <span className="shrink-0 text-amber-800 dark:text-amber-300">
                          {request.distinctRequesterCount} interested
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/requests"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300"
                >
                  Review snack requests
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Card>
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                  Inventory health
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Distribution by current stock status.
                </p>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
              >
                View inventory
              </Link>
            </div>
            {summaryQuery.isLoading ? (
              <Skeleton className="mt-5 h-5 w-full rounded-full" />
            ) : summaryQuery.isError ? (
              <p className="mt-5 text-xs text-neutral-500">
                Inventory health is unavailable.
              </p>
            ) : healthTotal === 0 ? (
              <p className="mt-5 rounded-xl bg-neutral-50 p-4 text-xs text-neutral-500 dark:bg-neutral-800/50">
                No inventory has been added yet.
              </p>
            ) : (
              <>
                <div
                  className="mt-5 flex h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                  role="img"
                  aria-label={healthSegments
                    .map(
                      (segment) =>
                        `${segment.label}: ${segment.count} of ${healthTotal}`
                    )
                    .join(", ")}
                >
                  {healthSegments.map((segment) => (
                    <div
                      key={segment.label}
                      className={segment.color}
                      style={{
                        width: `${(segment.count / healthTotal) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {healthSegments.map((segment) => (
                    <div key={segment.label}>
                      <p className={`text-lg font-bold ${segment.text}`}>
                        {segment.count}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {segment.label}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                  Highest demand
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Pending product groups ranked by distinct employee interest.
                </p>
              </div>
              <Link
                href="/requests"
                className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
              >
                All requests
              </Link>
            </div>
            {requestsQuery.isLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : requestsQuery.isError ? (
              <div className="mt-4">
                <PanelError
                  message="We couldn't load request demand."
                  onRetry={() => void requestsQuery.refetch()}
                />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-xs text-neutral-500 dark:bg-neutral-800/50">
                No pending requests to rank right now.
              </p>
            ) : (
              <ol className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                {pendingRequests.slice(0, 4).map((request, index) => (
                  <li
                    key={request.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {request.productName}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {request.distinctRequesterCount} interested
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClockCounterClockwise
                  className="h-4 w-4 text-neutral-500"
                  weight="bold"
                  aria-hidden="true"
                />
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                  Recent pantry activity
                </h2>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Latest consumption and restocking events.
              </p>
            </div>
            <Link
              href="/activity"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
            >
              Activity log
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {activitiesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-10 w-full" />
              ))}
            </div>
          ) : activitiesQuery.isError ? (
            <PanelError
              message="We couldn't load recent activity."
              onRetry={() => void activitiesQuery.refetch()}
            />
          ) : activities.length === 0 ? (
            <p className="rounded-xl bg-neutral-50 p-4 text-xs text-neutral-500 dark:bg-neutral-800/50">
              No pantry activity has been recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {activities.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        item.action === "restocked"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {item.action === "restocked" ? (
                        <Package
                          className="h-4 w-4"
                          weight="bold"
                          aria-hidden="true"
                        />
                      ) : (
                        <ClockCounterClockwise
                          className="h-4 w-4"
                          weight="bold"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-neutral-800 dark:text-neutral-200">
                        <span className="font-semibold">{item.userName}</span>{" "}
                        {item.action === "restocked" ? "restocked" : "consumed"}{" "}
                        <span className="font-semibold">{item.snackName}</span>
                      </p>
                      {item.note && (
                        <p className="truncate text-[11px] text-neutral-400">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-11 sm:pl-0">
                    <span className="text-xs text-neutral-500">
                      {item.action === "restocked" ? "+" : "−"}
                      {item.amount}
                    </span>
                    <time
                      className="text-[11px] text-neutral-400"
                      dateTime={item.createdAt}
                    >
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
