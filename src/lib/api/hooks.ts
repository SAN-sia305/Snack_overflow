"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { snackService, GetSnacksParams, CreateSnackInput } from "@/lib/mock/services/snackService";
import { voteService } from "@/lib/mock/services/voteService";
import { snackRequestService, SubmitSnackRequestInput } from "@/lib/mock/services/snackRequestService";
import { adminService, AddPurchasedToInventoryInput } from "@/lib/mock/services/adminService";
import { activityService, GetActivitiesParams } from "@/lib/mock/services/activityService";
import { ProductRequestStatus } from "@/types";

// ========================
// Snack Queries & Mutations
// ========================

export function useSnacks(params: GetSnacksParams = {}) {
  return useQuery({
    queryKey: ["snacks", params],
    queryFn: () => snackService.getSnacks(params),
  });
}

export function useSnack(id: string) {
  return useQuery({
    queryKey: ["snack", id],
    queryFn: () => snackService.getSnackById(id),
    enabled: !!id,
  });
}

export function useSnackOfTheWeek() {
  return useQuery({
    queryKey: ["snackOfTheWeek"],
    queryFn: () => snackService.getSnackOfTheWeek(),
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ["newArrivals"],
    queryFn: () => snackService.getNewArrivals(),
  });
}

export function useConsumeSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      snackId,
      user,
    }: {
      snackId: string;
      user: { id: string; name: string; role: "admin" | "member" };
    }) => snackService.consumeSnack(snackId, user),
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
  });
}

export function useRestockSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      snackId,
      quantity,
      note,
      user,
    }: {
      snackId: string;
      quantity: number;
      note?: string;
      user?: { id: string; name: string; role: "admin" | "member" };
    }) => snackService.restockSnack(snackId, quantity, note, user),
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
  });
}

export function useCreateSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSnackInput) => snackService.createSnack(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
  });
}

export function useUpdateSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateSnackInput>;
    }) => snackService.updateSnack(id, updates),
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}

export function useDeleteSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => snackService.deleteSnack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}

// ========================
// Vote Queries & Mutations
// ========================

export function useUserVotes(userId: string) {
  return useQuery({
    queryKey: ["userVotes", userId],
    queryFn: () => voteService.getUserVotes(userId),
    enabled: !!userId,
  });
}

export function useToggleVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snackId, userId }: { snackId: string; userId: string }) =>
      voteService.toggleVote(snackId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userVotes", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", variables.snackId] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
    },
  });
}

// ========================
// Member Request Queries
// ========================

export function useMyRequests(userId: string) {
  return useQuery({
    queryKey: ["myRequests", userId],
    queryFn: () => snackRequestService.getMyRequests(userId),
    enabled: !!userId,
  });
}

export function useSubmitSnackRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: SubmitSnackRequestInput;
    }) => snackRequestService.submitRequest(userId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myRequests", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}

// ========================
// Admin Queries & Mutations
// ========================

export function useAdminSummary() {
  return useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => adminService.getAdminSummary(),
  });
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: () => adminService.getAdminAlerts(),
  });
}

export function useProductRequests(statusFilter?: ProductRequestStatus | "all") {
  return useQuery({
    queryKey: ["admin", "requests", statusFilter],
    queryFn: () => adminService.getProductRequests(statusFilter),
  });
}

export function useUpdateProductRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      decisionNote,
    }: {
      id: string;
      status: ProductRequestStatus;
      decisionNote?: string;
    }) => adminService.updateProductRequestStatus(id, status, decisionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}

export function useAddPurchasedToInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productRequestId,
      snackData,
    }: {
      productRequestId: string;
      snackData: AddPurchasedToInventoryInput;
    }) => adminService.addPurchasedToInventory(productRequestId, snackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
  });
}

export function useAdminActivities(params: GetActivitiesParams = {}) {
  return useQuery({
    queryKey: ["admin", "activities", params],
    queryFn: () => activityService.getActivities(params),
  });
}

