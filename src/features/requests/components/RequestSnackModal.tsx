"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubmitSnackRequest } from "@/lib/api/hooks";
import { toast } from "@/store/useToastStore";
import { Tray, CurrencyInr, ChatText, Sparkle } from "@phosphor-icons/react";

const requestSchema = z.object({
  productName: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(60, "Product name must be under 60 characters"),
  expectedPriceInr: z
    .number({ invalid_type_error: "Price must be a valid number" })
    .positive("Price must be greater than ₹0")
    .max(5000, "Price seems unrealistically high"),
  note: z.string().max(200, "Note must be under 200 characters").optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function RequestSnackModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { currentUser } = useAuthStore();
  const submitMutation = useSubmitSnackRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      productName: "",
      expectedPriceInr: 40,
      note: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    try {
      await submitMutation.mutateAsync({
        userId: currentUser.id,
        input: {
          productName: data.productName,
          expectedPriceInr: data.expectedPriceInr,
          note: data.note,
        },
      });

      toast.success(
        "Request Submitted!",
        `"${data.productName}" has been submitted for admin pantry review.`
      );
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(
        "Request Failed",
        error instanceof Error ? error.message : "Failed to submit request."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mb-1">
            <Tray className="w-5 h-5" weight="bold" />
          </div>
          <DialogTitle>Request a New Snack</DialogTitle>
          <DialogDescription>
            Can&apos;t find your favorite snack? Submit a request so our pantry team can aggregate employee demand.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Snack Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Snack / Product Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("productName")}
              placeholder="e.g. Masala Roasted Cashews"
              error={errors.productName?.message}
            />
            {errors.productName && (
              <p className="text-xs text-rose-500 mt-1">{errors.productName.message}</p>
            )}
          </div>

          {/* Expected Price */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Expected Price (in INR) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="1"
              min="1"
              startIcon={<CurrencyInr className="w-4 h-4" />}
              {...register("expectedPriceInr", { valueAsNumber: true })}
              placeholder="40"
              error={errors.expectedPriceInr?.message}
            />
            {errors.expectedPriceInr && (
              <p className="text-xs text-rose-500 mt-1">{errors.expectedPriceInr.message}</p>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              Approximate retail price per individual packet or unit.
            </p>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Why would the team love it? <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              {...register("note")}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 p-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-colors"
              placeholder="e.g. Great protein boost for afternoon deep work sessions."
            />
            {errors.note && (
              <p className="text-xs text-rose-500 mt-1">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="md"
              isLoading={submitMutation.isPending}
              className="font-semibold"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
