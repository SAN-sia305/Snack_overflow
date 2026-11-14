"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSnackInput,
  GetSnacksParams,
  UpdateSnackInput,
} from "@/lib/api/snacks";
import {
  consumeSnack as consumeSnackApi,
  createSnack as createSnackApi,
  deleteSnack as deleteSnackApi,
  fetchSnack,
  fetchSnacks,
  restockSnack as restockSnackApi,
  updateSnack as updateSnackApi,
} from "@/lib/api/snacks";
import {
  fetchUserVotes,
  toggleVote as toggleVoteApi,
} from "@/lib/api/votes";
import {
  fetchAdminProductRequests as fetchAdminProductRequestsApi,
  fetchMyRequests as fetchMyRequestsApi,
  submitSnackRequest as submitSnackRequestApi,
  updateProductRequestStatus as updateProductRequestStatusApi,
  addPurchasedToInventory as addPurchasedToInventoryApi,
} from "@/lib/api/requests";
import type {
  AddPurchasedToInventoryPayload,
  SubmitSnackRequestInput,
} from "@/lib/api/request-contracts";
import {
  fetchAdminAlerts as fetchAdminAlertsApi,
  fetchAdminSummary as fetchAdminSummaryApi,
  fetchAdminActivities as fetchAdminActivitiesApi,
  type GetActivitiesParams,
} from "@/lib/api/admin";
import { ProductRequestStatus, Snack } from "@/types";

// ========================
// Snack Queries & Mutations
// ========================

export function useSnacks(params: GetSnacksParams = {}) {
  return useQuery({
    queryKey: ["snacks", params],
    queryFn: () => fetchSnacks(params),
  });
}

export function useSnack(id: string) {
  return useQuery({
    queryKey: ["snack", id],
    queryFn: () => fetchSnack(id),
    enabled: !!id,
  });
}

export function useSnackOfTheWeek() {
  return useQuery({
    queryKey: ["snackOfTheWeek"],
    queryFn: async () => {
      const snacks = await fetchSnacks({ sortBy: "votes-desc", limit: 1 });
      return snacks[0] ?? null;
    },
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ["newArrivals"],
    queryFn: () => fetchSnacks({ newArrivals: true, sortBy: "newest" }),
  });
}

export function useConsumeSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snackId }: { snackId: string }) =>
      consumeSnackApi(snackId),
    onMutate: async ({ snackId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["snacks"] }),
        queryClient.cancelQueries({ queryKey: ["snack", snackId] }),
        queryClient.cancelQueries({ queryKey: ["snackOfTheWeek"] }),
        queryClient.cancelQueries({ queryKey: ["newArrivals"] }),
      ]);

      const snackLists = queryClient.getQueriesData<Snack[]>({
        queryKey: ["snacks"],
      });
      const snack = queryClient.getQueryData<Snack | null>(["snack", snackId]);
      const snackOfTheWeek =
        queryClient.getQueryData<Snack | null>(["snackOfTheWeek"]);
      const newArrivals = queryClient.getQueryData<Snack[]>(["newArrivals"]);
      const optimisticUpdate = (item: Snack) =>
        item.id === snackId
          ? {
              ...item,
              quantity: Math.max(0, item.quantity - 1),
              updatedAt: new Date().toISOString(),
            }
          : item;

      queryClient.setQueriesData<Snack[]>({ queryKey: ["snacks"] }, (current) =>
        current?.map(optimisticUpdate)
      );
      queryClient.setQueryData<Snack | null>(["snack", snackId], (current) =>
        current ? optimisticUpdate(current) : current
      );
      queryClient.setQueryData<Snack | null>(["snackOfTheWeek"], (current) =>
        current ? optimisticUpdate(current) : current
      );
      queryClient.setQueryData<Snack[]>(["newArrivals"], (current) =>
        current?.map(optimisticUpdate)
      );

      return { snackLists, snack, snackOfTheWeek, newArrivals };
    },
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
    onError: (_error, variables, context) => {
      context?.snackLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      queryClient.setQueryData(["snack", variables.snackId], context?.snack);
      queryClient.setQueryData(["snackOfTheWeek"], context?.snackOfTheWeek);
      queryClient.setQueryData(["newArrivals"], context?.newArrivals);
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", variables.snackId] });
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
    }: {
      snackId: string;
      quantity: number;
      note?: string;
    }) => restockSnackApi(snackId, { quantity, note }),
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
    },
  });
}

export function useCreateSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSnackInput) => createSnackApi(input),
    onSuccess: (snack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", snack.id] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
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
      updates: UpdateSnackInput;
    }) => updateSnackApi(id, updates),
    onSuccess: (updatedSnack) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", updatedSnack.id] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
    },
  });
}

export function useDeleteSnack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSnackApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.removeQueries({ queryKey: ["snack", id], exact: true });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
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
    queryFn: fetchUserVotes,
    enabled: !!userId,
  });
}

export function useToggleVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      snackId,
    }: {
      snackId: string;
      userId: string;
    }) => toggleVoteApi(snackId),
    onMutate: async ({ snackId, userId }) => {
      const userVotesKey = ["userVotes", userId];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["snacks"] }),
        queryClient.cancelQueries({ queryKey: ["snack", snackId] }),
        queryClient.cancelQueries({ queryKey: ["snackOfTheWeek"] }),
        queryClient.cancelQueries({ queryKey: ["newArrivals"] }),
        queryClient.cancelQueries({ queryKey: userVotesKey }),
      ]);

      const snackLists = queryClient.getQueriesData<Snack[]>({
        queryKey: ["snacks"],
      });
      const snack = queryClient.getQueryData<Snack | null>(["snack", snackId]);
      const snackOfTheWeek =
        queryClient.getQueryData<Snack | null>(["snackOfTheWeek"]);
      const newArrivals = queryClient.getQueryData<Snack[]>(["newArrivals"]);
      const userVotes = queryClient.getQueryData<string[]>(userVotesKey);
      const hadVoted = userVotes?.includes(snackId) ?? false;
      const updateSnackVote = (item: Snack) =>
        item.id === snackId
          ? { ...item, voteCount: Math.max(0, item.voteCount + (hadVoted ? -1 : 1)) }
          : item;

      queryClient.setQueriesData<Snack[]>({ queryKey: ["snacks"] }, (current) =>
        current?.map(updateSnackVote)
      );
      queryClient.setQueryData<Snack | null>(["snack", snackId], (current) =>
        current ? updateSnackVote(current) : current
      );
      queryClient.setQueryData<Snack | null>(["snackOfTheWeek"], (current) =>
        current ? updateSnackVote(current) : current
      );
      queryClient.setQueryData<Snack[]>(["newArrivals"], (current) =>
        current?.map(updateSnackVote)
      );
      queryClient.setQueryData<string[]>(userVotesKey, (current = []) =>
        hadVoted
          ? current.filter((id) => id !== snackId)
          : [...current, snackId]
      );

      return {
        snackLists,
        snack,
        snackOfTheWeek,
        newArrivals,
        userVotes,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userVotes", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", variables.snackId] });
      queryClient.invalidateQueries({ queryKey: ["snackOfTheWeek"] });
      queryClient.invalidateQueries({ queryKey: ["newArrivals"] });
    },
    onError: (_error, variables, context) => {
      context?.snackLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      queryClient.setQueryData(["snack", variables.snackId], context?.snack);
      queryClient.setQueryData(["snackOfTheWeek"], context?.snackOfTheWeek);
      queryClient.setQueryData(["newArrivals"], context?.newArrivals);
      if (context?.userVotes) {
        queryClient.setQueryData(
          ["userVotes", variables.userId],
          context.userVotes
        );
      } else {
        queryClient.removeQueries({
          queryKey: ["userVotes", variables.userId],
          exact: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["snacks"] });
      queryClient.invalidateQueries({ queryKey: ["snack", variables.snackId] });
    },
  });
}

// ========================
// Member Request Queries
// ========================

export function useMyRequests(userId: string) {
  return useQuery({
    queryKey: ["myRequests", userId],
    queryFn: fetchMyRequestsApi,
    enabled: !!userId,
  });
}

export function useSubmitSnackRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
    }: {
      userId: string;
      input: SubmitSnackRequestInput;
    }) => submitSnackRequestApi(input),
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
    queryFn: fetchAdminSummaryApi,
  });
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: fetchAdminAlertsApi,
  });
}

export function useProductRequests(statusFilter?: ProductRequestStatus | "all") {
  return useQuery({
    queryKey: ["admin", "requests", statusFilter],
    queryFn: () => fetchAdminProductRequestsApi(statusFilter),
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
      status: "approved" | "rejected" | "purchased";
      decisionNote?: string;
    }) => updateProductRequestStatusApi(id, { status, decisionNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
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
      snackData: AddPurchasedToInventoryPayload;
    }) => addPurchasedToInventoryApi(productRequestId, snackData),
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
    queryFn: () => fetchAdminActivitiesApi(params),
  });
}
