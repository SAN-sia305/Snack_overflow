"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddPurchasedToInventory,
  useProductRequests,
  useUpdateProductRequestStatus,
} from "@/lib/api/hooks";
import { SnackProductRequest, ProductRequestStatus, SnackCategory } from "@/types";
import type { AddPurchasedToInventoryPayload as AddPurchasedToInventoryInput } from "@/lib/api/request-contracts";
import { toast } from "@/store/useToastStore";
import {
  Check,
  CaretDown,
  CurrencyInr,
  Package,
  ShoppingCart,
  ThumbsUp,
  Tray,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

const STATUSES: { value: ProductRequestStatus | "all"; label: string }[] = [
  { value: "requested", label: "Needs review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "purchased", label: "Purchased" },
  { value: "available", label: "Available" },
  { value: "all", label: "All requests" },
];

const CATEGORY_OPTIONS: { value: SnackCategory; label: string }[] = [
  { value: "sweet", label: "Sweet" },
  { value: "savoury", label: "Savoury" },
  { value: "drink", label: "Drink" },
  { value: "healthy-ish", label: "Healthy-ish" },
];

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

const inventorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name must be under 60 characters"),
  category: z.enum(["sweet", "savoury", "drink", "healthy-ish"]),
  description: z.string().trim().min(4, "Add a short description").max(300, "Description must be under 300 characters"),
  quantity: z.number().int("Enter a whole number").positive("Enter at least 1 packet"),
  lowStockThreshold: z.number().int("Enter a whole number").min(0, "Threshold cannot be negative"),
  imageUrl: z.string().trim().url("Enter a valid image URL"),
  priceInr: z.union([z.number().finite().positive("Price must be positive"), z.nan()]).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function expectedPriceSummary(request: SnackProductRequest): string {
  if (request.requests.length === 0) return "No price estimates";
  const prices = request.requests.map((item) => item.expectedPriceInr);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min} expected` : `₹${min}–₹${max} expected`;
}

function ActionConfirmation({
  request,
  status,
  onClose,
}: {
  request: SnackProductRequest | null;
  status: "approved" | "rejected" | "purchased" | null;
  onClose: () => void;
}) {
  const mutation = useUpdateProductRequestStatus();

  const copy = {
    approved: {
      title: "Approve this product?",
      body: "This approves the product group once. It does not add anything to inventory.",
      action: "Approve product",
    },
    rejected: {
      title: "Reject this product?",
      body: "This marks the product request as declined for everyone who requested it.",
      action: "Reject product",
    },
    purchased: {
      title: "Mark this product as purchased?",
      body: "This records the purchase. Inventory will not change until you add the arrival to the pantry.",
      action: "Mark purchased",
    },
  } as const;

  if (!request || !status) return null;
  const details = copy[status];

  const confirm = async () => {
    try {
      await mutation.mutateAsync({ id: request.id, status });
      toast.success(
        "Request updated",
        `${request.productName} marked ${status}.`
      );
      onClose();
    } catch (error: unknown) {
      toast.error("Could not update request", getErrorMessage(error));
    }
  };

  return (
    <Dialog open={!!request && !!status} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>
            <strong>{request.productName}</strong> — {details.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={status === "rejected" ? "destructive" : "default"}
            onClick={() => void confirm()}
            isLoading={mutation.isPending}
          >
            {details.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddToInventoryDialog({
  request,
  onClose,
}: {
  request: SnackProductRequest | null;
  onClose: () => void;
}) {
  const mutation = useAddPurchasedToInventory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      category: "sweet",
      description: "",
      quantity: 20,
      lowStockThreshold: 5,
      imageUrl: DEFAULT_IMAGE,
      priceInr: Number.NaN,
    },
  });

  const open = !!request;

  useEffect(() => {
    if (request) {
      reset({
        name: request.productName,
        category: "sweet",
        description: "",
        quantity: 20,
        lowStockThreshold: 5,
        imageUrl: DEFAULT_IMAGE,
        priceInr: Number.NaN,
      });
    }
  }, [request, reset]);

  const submit = async (data: InventoryFormData) => {
    if (!request) return;
    const snackData: AddPurchasedToInventoryInput = {
      ...data,
      priceInr:
        typeof data.priceInr === "number" && Number.isFinite(data.priceInr)
          ? data.priceInr
          : undefined,
    };
    try {
      await mutation.mutateAsync({
        productRequestId: request.id,
        snackData,
      });
      toast.success(
        "Added to pantry",
        `${data.name} is now in inventory and New Arrivals.`
      );
      onClose();
    } catch (error: unknown) {
      toast.error("Could not add to pantry", getErrorMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      {request && (
        <DialogContent
          onClose={onClose}
          className="max-h-[90vh] max-w-xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Add {request.productName} to inventory</DialogTitle>
            <DialogDescription>
              Confirm the item details and actual arrival quantity. The request becomes Available only after the snack is added.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(submit)}
            className="space-y-4"
            onReset={() => reset()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Pantry name
                <Input
                  {...register("name")}
                  placeholder={request.productName}
                  error={errors.name?.message}
                />
                {errors.name && <span className="block font-normal text-rose-500">{errors.name.message}</span>}
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Category
                <select
                  {...register("category")}
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  {CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Actual arrival quantity
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...register("quantity", { valueAsNumber: true })}
                  error={errors.quantity?.message}
                />
                {errors.quantity && <span className="block font-normal text-rose-500">{errors.quantity.message}</span>}
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Low-stock threshold
                <Input
                  type="number"
                  min="0"
                  step="1"
                  {...register("lowStockThreshold", { valueAsNumber: true })}
                  error={errors.lowStockThreshold?.message}
                />
                {errors.lowStockThreshold && <span className="block font-normal text-rose-500">{errors.lowStockThreshold.message}</span>}
              </label>
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Description
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              {errors.description && <span className="block font-normal text-rose-500">{errors.description.message}</span>}
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Image URL
              <Input {...register("imageUrl")} error={errors.imageUrl?.message} />
              {errors.imageUrl && <span className="block font-normal text-rose-500">{errors.imageUrl.message}</span>}
            </label>
            <label className="block max-w-xs space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Actual price in INR <span className="font-normal text-neutral-400">(optional)</span>
              <Input
                type="number"
                min="1"
                step="1"
                startIcon={<CurrencyInr className="h-4 w-4" aria-hidden="true" />}
                {...register("priceInr", {
                  setValueAs: (value: string) =>
                    value === "" ? Number.NaN : Number(value),
                })}
                error={errors.priceInr?.message}
              />
              {errors.priceInr && <span className="block font-normal text-rose-500">{errors.priceInr.message}</span>}
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                Add to inventory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

function RequestCard({
  request,
  isExpanded,
  onToggleExpanded,
  onAction,
  onAddToInventory,
  isUpdating,
}: {
  request: SnackProductRequest;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAction: (request: SnackProductRequest, status: "approved" | "rejected" | "purchased") => void;
  onAddToInventory: (request: SnackProductRequest) => void;
  isUpdating: boolean;
}) {
  const requesters = [...request.requests].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[request.status]} className="capitalize">
                {request.status}
              </Badge>
              {request.status === "requested" && (
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                  Rank by team demand
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {request.productName}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                {request.distinctRequesterCount} distinct requester
                {request.distinctRequesterCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <CurrencyInr className="h-3.5 w-3.5" aria-hidden="true" />
                {expectedPriceSummary(request)}
              </span>
              <span>
                Requested {formatDate(request.createdAt)}
                {request.updatedAt !== request.createdAt &&
                  ` · Updated ${formatDate(request.updatedAt)}`}
              </span>
            </div>
            {request.decisionNote && (
              <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-300">
                Admin note: {request.decisionNote}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {request.status === "requested" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(request, "approved")}
                  disabled={isUpdating}
                  className="text-emerald-700 dark:text-emerald-400"
                >
                  <Check className="h-4 w-4" weight="bold" aria-hidden="true" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(request, "rejected")}
                  disabled={isUpdating}
                  className="text-rose-700 dark:text-rose-400"
                >
                  <X className="h-4 w-4" weight="bold" aria-hidden="true" />
                  Reject
                </Button>
              </>
            )}
            {request.status === "approved" && (
              <Button
                size="sm"
                onClick={() => onAction(request, "purchased")}
                disabled={isUpdating}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Mark purchased
              </Button>
            )}
            {request.status === "purchased" && (
              <Button size="sm" onClick={() => onAddToInventory(request)}>
                <Package className="h-4 w-4" aria-hidden="true" />
                Add to pantry
              </Button>
            )}
            {request.status === "available" && request.linkedSnackId && (
              <Link
                href="/inventory"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                In pantry ({request.actualQuantityAdded ?? 0})
              </Link>
            )}
            {request.status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <WarningCircle className="h-4 w-4" aria-hidden="true" />
                Decision complete
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggleExpanded}
            className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-orange-600 dark:text-neutral-300 dark:hover:text-orange-400"
          >
            <CaretDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            {isExpanded ? "Hide" : "View"} requester details ({requesters.length})
          </button>
          {isExpanded && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {requesters.length === 0 ? (
                <p className="text-xs text-neutral-500">No requester details are available.</p>
              ) : (
                requesters.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                          {item.userName || "Team member"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          Requested {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">₹{item.expectedPriceInr}</Badge>
                    </div>
                    {item.note && (
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<ProductRequestStatus | "all">("requested");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<{
    request: SnackProductRequest;
    status: "approved" | "rejected" | "purchased";
  } | null>(null);
  const [addingRequest, setAddingRequest] = useState<SnackProductRequest | null>(null);
  const requestsQuery = useProductRequests(statusFilter);
  const statusMutation = useUpdateProductRequestStatus();
  const requests = requestsQuery.data ?? [];

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <AppShell title="Snack Demand Management">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500 p-2.5 text-white shadow-md shadow-amber-500/20">
            <Tray className="h-6 w-6" weight="fill" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Snack requests &amp; demand
            </h1>
            <p className="text-xs text-neutral-500">
              Product groups are ranked by distinct verified employee interest—not individual request volume.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter product requests">
          {STATUSES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`min-h-10 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                statusFilter === item.value
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {requestsQuery.isLoading
              ? "Loading product requests…"
              : `${requests.length} product group${requests.length === 1 ? "" : "s"}`}
          </span>
          {statusFilter === "requested" && requests.length > 0 && (
            <span>Highest demand first</span>
          )}
        </div>

        {requestsQuery.isLoading ? (
          <div className="space-y-4" aria-label="Loading requests">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-48 rounded-2xl" />)}
          </div>
        ) : requestsQuery.isError ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              We couldn&apos;t load product requests. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void requestsQuery.refetch()}>
              Try again
            </Button>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <Tray className="mb-3 h-8 w-8 text-neutral-400" aria-hidden="true" />
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
              No {statusFilter === "all" ? "" : `${statusFilter} `}product requests
            </h2>
            <p className="mt-1 max-w-md text-sm text-neutral-500">
              Product groups submitted by members will appear here. Member details and notes are only shown in this admin view.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isExpanded={expandedIds.includes(request.id)}
                onToggleExpanded={() => toggleExpanded(request.id)}
                onAction={(product, status) => setConfirming({ request: product, status })}
                onAddToInventory={setAddingRequest}
                isUpdating={statusMutation.isPending && statusMutation.variables?.id === request.id}
              />
            ))}
          </div>
        )}
      </div>

      <ActionConfirmation
        request={confirming?.request ?? null}
        status={confirming?.status ?? null}
        onClose={() => setConfirming(null)}
      />
      <AddToInventoryDialog
        request={addingRequest}
        onClose={() => setAddingRequest(null)}
      />
    </AppShell>
  );
}
