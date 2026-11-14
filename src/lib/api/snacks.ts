import {
  snackDetailResponseSchema,
  snackListResponseSchema,
} from "@/lib/api/snack-contracts";
import { ApiClientError, requestJson } from "@/lib/api/client";
import type { GetSnacksParams } from "@/lib/mock/services/snackService";

export async function fetchSnacks(
  params: GetSnacksParams = {}
) {
  const query = new URLSearchParams();
  const values: Record<string, string | undefined> = {
    search: params.search?.trim() || undefined,
    category:
      params.category && params.category !== "all"
        ? params.category
        : undefined,
    status:
      params.status && params.status !== "all" ? params.status : undefined,
    sortBy: params.sortBy,
    page: params.page?.toString(),
    limit: (params.limit ?? 100).toString(),
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      query.set(key, value);
    }
  }

  const response = await requestJson(`/api/snacks?${query.toString()}`);
  return snackListResponseSchema.parse(response).items;
}

export async function fetchSnack(id: string) {
  try {
    const response = await requestJson(
      `/api/snacks/${encodeURIComponent(id)}`
    );
    return snackDetailResponseSchema.parse(response).snack;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
