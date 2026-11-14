"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSnack,
  useDeleteSnack,
  useRestockSnack,
  useSnacks,
  useUpdateSnack,
} from "@/lib/api/hooks";
import { getStockStatus } from "@/lib/mock/store";
import { CreateSnackInput } from "@/lib/mock/services/snackService";
import { UpdateSnackInput } from "@/lib/api/snacks";
import { Snack, SnackCategory, SnackStatus } from "@/types";
import { useCurrentUser } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import {
  ArrowClockwise,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";

const snackSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name must be under 60 characters"),
  category: z.enum(["sweet", "savoury", "drink", "healthy-ish"]),
  description: z.string().trim().min(4, "Add a short description").max(300, "Description must be under 300 characters"),
  quantity: z.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.number().int("Threshold must be a whole number").min(0, "Threshold cannot be negative"),
  imageUrl: z.string().trim().url("Enter a valid image URL"),
  priceInr: z.union([
    z.number().finite().positive("Price must be greater than ₹0"),
    z.nan(),
  ]).optional(),
});

type SnackFormData = z.infer<typeof snackSchema>;

const restockSchema = z.object({
  quantity: z.number().int("Enter a whole number").positive("Enter at least 1 packet"),
  note: z.string().max(200, "Note must be under 200 characters").optional(),
});

type RestockFormData = z.infer<typeof restockSchema>;

const CATEGORIES: { label: string; value: SnackCategory | "all" }[] = [
  { label: "All categories", value: "all" },
  { label: "Sweet", value: "sweet" },
  { label: "Savoury", value: "savoury" },
  { label: "Drink", value: "drink" },
  { label: "Healthy-ish", value: "healthy-ish" },
];

const STATUSES: { label: string; value: SnackStatus | "all" }[] = [
  { label: "All stock states", value: "all" },
  { label: "Stocked", value: "stocked" },
  { label: "Running low", value: "running_low" },
  { label: "Gone", value: "gone" },
];

function formatUpdated(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function SnackFormDialog({
  open,
  snack,
  onOpenChange,
}: {
  open: boolean;
  snack: Snack | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateSnack();
  const updateMutation = useUpdateSnack();
  const isEditing = snack !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SnackFormData>({
    resolver: zodResolver(snackSchema),
    defaultValues: {
      name: "",
      category: "sweet",
      description: "",
      quantity: 0,
      lowStockThreshold: 5,
      imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
      priceInr: Number.NaN,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      snack
        ? {
            name: snack.name,
            category: snack.category,
            description: snack.description,
            quantity: snack.quantity,
            lowStockThreshold: snack.lowStockThreshold,
            imageUrl: snack.imageUrl,
            priceInr: snack.priceInr ?? Number.NaN,
          }
        : {
            name: "",
            category: "sweet",
            description: "",
            quantity: 0,
            lowStockThreshold: 5,
            imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
            priceInr: Number.NaN,
          }
    );
  }, [open, snack, reset]);

  const submit = async (data: SnackFormData) => {
    const input: CreateSnackInput = {
      ...data,
      priceInr:
        typeof data.priceInr === "number" && Number.isFinite(data.priceInr)
          ? data.priceInr
          : undefined,
    };

    try {
      if (snack) {
        const updates: UpdateSnackInput = {
          ...input,
          priceInr: input.priceInr ?? null,
        };
        await updateMutation.mutateAsync({ id: snack.id, updates });
        toast.success("Snack updated", `${data.name} has been updated.`);
      } else {
        await createMutation.mutateAsync(input);
        toast.success("Snack added", `${data.name} is now in the pantry.`);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        isEditing ? "Could not update snack" : "Could not add snack",
        errorMessage(error, "Please check the snack details and try again.")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit snack" : "Add a snack"}</DialogTitle>
          <DialogDescription>
            Add pantry details and set the stock level that should trigger a low-stock alert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Snack name
              <Input {...register("name")} placeholder="e.g. Millet Cookies" error={errors.name?.message} />
              {errors.name && <span className="block font-normal text-rose-500">{errors.name.message}</span>}
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Category
              <select
                {...register("category")}
                className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {CATEGORIES.filter((category) => category.value !== "all").map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Quantity
              <Input type="number" min="0" step="1" {...register("quantity", { valueAsNumber: true })} error={errors.quantity?.message} />
              {errors.quantity && <span className="block font-normal text-rose-500">{errors.quantity.message}</span>}
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Low-stock threshold
              <Input type="number" min="0" step="1" {...register("lowStockThreshold", { valueAsNumber: true })} error={errors.lowStockThreshold?.message} />
              {errors.lowStockThreshold && <span className="block font-normal text-rose-500">{errors.lowStockThreshold.message}</span>}
            </label>
          </div>
          <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Description
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="A short, realistic description"
            />
            {errors.description && <span className="block font-normal text-rose-500">{errors.description.message}</span>}
          </label>
          <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Image URL
            <Input {...register("imageUrl")} placeholder="https://..." error={errors.imageUrl?.message} />
            {errors.imageUrl && <span className="block font-normal text-rose-500">{errors.imageUrl.message}</span>}
          </label>
          <label className="block max-w-xs space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Price in INR <span className="font-normal text-neutral-400">(optional)</span>
            <Input type="number" min="1" step="1" {...register("priceInr", { setValueAs: (value: string) => value === "" ? Number.NaN : Number(value) })} error={errors.priceInr?.message} />
            {errors.priceInr && <span className="block font-normal text-rose-500">{errors.priceInr.message}</span>}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? "Save changes" : "Add snack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RestockDialog({
  snack,
  onOpenChange,
}: {
  snack: Snack | null;
  onOpenChange: (snack: Snack | null) => void;
}) {
  const currentUser = useCurrentUser();
  const mutation = useRestockSnack();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: 1, note: "" },
  });
  const quantityToAdd = watch("quantity");

  useEffect(() => {
    if (snack) reset({ quantity: 1, note: "" });
  }, [snack, reset]);

  const submit = async (data: RestockFormData) => {
    if (!snack) return;
    try {
      await mutation.mutateAsync({
        snackId: snack.id,
        quantity: data.quantity,
        note: data.note?.trim() || undefined,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
      });
      toast.success(
        "Stock updated",
        `Added ${data.quantity} packets of ${snack.name}.`
      );
      onOpenChange(null);
    } catch (error: unknown) {
      toast.error("Could not restock", errorMessage(error, "Please try again."));
    }
  };

  return (
    <Dialog open={!!snack} onOpenChange={(open) => !open && onOpenChange(null)}>
      {snack && (
        <DialogContent onClose={() => onOpenChange(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restock {snack.name}</DialogTitle>
            <DialogDescription>
              Current quantity: <strong>{snack.quantity}</strong>. Add packets to update inventory and record this restock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Quantity to add
              <Input type="number" min="1" step="1" {...register("quantity", { valueAsNumber: true })} error={errors.quantity?.message} />
              {errors.quantity && <span className="block font-normal text-rose-500">{errors.quantity.message}</span>}
            </label>
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
              Projected quantity:{" "}
              <strong>{snack.quantity + (Number.isInteger(quantityToAdd) && quantityToAdd > 0 ? quantityToAdd : 0)}</strong>
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Note <span className="font-normal text-neutral-400">(optional)</span>
              <textarea
                {...register("note")}
                rows={2}
                className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder="e.g. Weekly pantry restock"
              />
              {errors.note && <span className="block font-normal text-rose-500">{errors.note.message}</span>}
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(null)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                Confirm restock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

function DeleteSnackDialog({
  snack,
  onOpenChange,
}: {
  snack: Snack | null;
  onOpenChange: (snack: Snack | null) => void;
}) {
  const mutation = useDeleteSnack();

  const confirmDelete = async () => {
    if (!snack) return;
    try {
      await mutation.mutateAsync(snack.id);
      toast.success("Snack deleted", `${snack.name} was removed from inventory.`);
      onOpenChange(null);
    } catch (error: unknown) {
      toast.error("Could not delete snack", errorMessage(error, "Please try again."));
    }
  };

  return (
    <Dialog open={!!snack} onOpenChange={(open) => !open && onOpenChange(null)}>
      {snack && (
        <DialogContent onClose={() => onOpenChange(null)} className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <WarningCircle className="h-5 w-5" weight="fill" aria-hidden="true" />
            </div>
            <DialogTitle>Delete {snack.name}?</DialogTitle>
            <DialogDescription>
              This removes the snack from pantry inventory. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(null)} disabled={mutation.isPending}>
              Keep snack
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} isLoading={mutation.isPending}>
              Delete snack
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function SnackActions({
  snack,
  onEdit,
  onRestock,
  onDelete,
}: {
  snack: Snack;
  onEdit: (snack: Snack) => void;
  onRestock: (snack: Snack) => void;
  onDelete: (snack: Snack) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(snack)} aria-label={`Edit ${snack.name}`}>
        <PencilSimple className="h-4 w-4" aria-hidden="true" />
        Edit
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onRestock(snack)} aria-label={`Restock ${snack.name}`}>
        <ArrowClockwise className="h-4 w-4" aria-hidden="true" />
        Restock
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(snack)} aria-label={`Delete ${snack.name}`} className="text-rose-600 hover:text-rose-700 dark:text-rose-400">
        <Trash className="h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SnackCategory | "all">("all");
  const [status, setStatus] = useState<SnackStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "quantity-asc" | "newest" | "votes-desc">("name-asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [restockingSnack, setRestockingSnack] = useState<Snack | null>(null);
  const [deletingSnack, setDeletingSnack] = useState<Snack | null>(null);
  const query = useSnacks({
    search: search.trim() || undefined,
    category,
    status,
    sortBy,
  });
  const snacks = query.data ?? [];
  const activeFilters = category !== "all" || status !== "all" || search !== "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") {
      setEditingSnack(null);
      setFormOpen(true);
    }
    const statusParam = params.get("status");
    if (statusParam === "stocked" || statusParam === "running_low" || statusParam === "gone") {
      setStatus(statusParam);
    }
  }, []);

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return {
      total: all.length,
      low: all.filter((snack) => getStockStatus(snack.quantity, snack.lowStockThreshold) === "running_low").length,
      gone: all.filter((snack) => getStockStatus(snack.quantity, snack.lowStockThreshold) === "gone").length,
    };
  }, [query.data]);

  const openAdd = () => {
    setEditingSnack(null);
    setFormOpen(true);
  };

  const openEdit = (snack: Snack) => {
    setEditingSnack(snack);
    setFormOpen(true);
  };

  return (
    <AppShell title="Pantry Inventory">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500 p-2.5 text-white shadow-md shadow-orange-500/20">
              <Package className="h-6 w-6" weight="fill" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Pantry inventory
              </h1>
              <p className="text-xs text-neutral-500">
                Search, update, and restock the items available to your team.
              </p>
            </div>
          </div>
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" weight="bold" aria-hidden="true" />
            Add snack
          </Button>
        </header>

        <section aria-label="Inventory filters" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search snacks"
              aria-label="Search snacks"
              className="pl-10"
            />
          </div>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value as SnackCategory | "all")}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select
            aria-label="Filter by stock status"
            value={status}
            onChange={(event) => setStatus(event.target.value as SnackStatus | "all")}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select
            aria-label="Sort inventory"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="quantity-asc">Quantity: low first</option>
            <option value="newest">Recently added</option>
            <option value="votes-desc">Most voted</option>
          </select>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span>
            {query.isLoading ? "Loading inventory…" : `${snacks.length} snack${snacks.length === 1 ? "" : "s"} shown`}
          </span>
          <span className="flex gap-3">
            <span>{counts.low} running low</span>
            <span>{counts.gone} gone</span>
          </span>
          {activeFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 rounded-xl" />)}
          </div>
        ) : query.isError ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              We couldn&apos;t load inventory. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Try again</Button>
          </Card>
        ) : snacks.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <Package className="mb-3 h-8 w-8 text-neutral-400" aria-hidden="true" />
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
              {activeFilters || status !== "all" ? "No snacks match these filters" : "No snacks in inventory yet"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {activeFilters || status !== "all" ? "Try a different search or clear your filters." : "Add the first snack to get the pantry started."}
            </p>
            {activeFilters || status !== "all" ? (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setCategory("all"); setStatus("all"); }}>
                Clear filters
              </Button>
            ) : (
              <Button className="mt-4" onClick={openAdd}>Add snack</Button>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {snacks.map((snack) => {
                const stockStatus = getStockStatus(snack.quantity, snack.lowStockThreshold);
                return (
                  <Card key={snack.id} className="p-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <Image src={snack.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">{snack.name}</h2>
                          <Badge variant={stockStatus} dot>{stockStatus === "running_low" ? "Running low" : stockStatus === "gone" ? "Gone" : "Stocked"}</Badge>
                        </div>
                        <p className="mt-1 text-xs capitalize text-neutral-500">{snack.category} · {snack.quantity} in stock · Threshold {snack.lowStockThreshold}</p>
                        <p className="mt-1 text-[11px] text-neutral-400">Updated {formatUpdated(snack.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                      <SnackActions snack={snack} onEdit={openEdit} onRestock={setRestockingSnack} onDelete={setDeletingSnack} />
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-800/60">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Snack</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Threshold</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Last updated</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {snacks.map((snack) => {
                      const stockStatus = getStockStatus(snack.quantity, snack.lowStockThreshold);
                      return (
                        <tr key={snack.id} className="align-middle">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                <Image src={snack.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate font-semibold text-neutral-900 dark:text-neutral-100">{snack.name}</p>
                                {snack.priceInr && <p className="text-xs text-neutral-500">₹{snack.priceInr}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-300">{snack.category}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{snack.quantity} packets</span>
                              <Badge variant={stockStatus} dot>{stockStatus === "running_low" ? "Running low" : stockStatus === "gone" ? "Gone" : "Stocked"}</Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{snack.lowStockThreshold}</td>
                          <td className="px-4 py-3 text-xs text-neutral-500">{formatUpdated(snack.updatedAt)}</td>
                          <td className="px-4 py-3">
                            <SnackActions snack={snack} onEdit={openEdit} onRestock={setRestockingSnack} onDelete={setDeletingSnack} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      <SnackFormDialog
        open={formOpen}
        snack={editingSnack}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSnack(null);
        }}
      />
      <RestockDialog snack={restockingSnack} onOpenChange={setRestockingSnack} />
      <DeleteSnackDialog snack={deletingSnack} onOpenChange={setDeletingSnack} />
    </AppShell>
  );
}
