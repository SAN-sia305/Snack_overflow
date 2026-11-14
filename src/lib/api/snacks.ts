import {
  CreateSnackPayload,
  SnackListQuery,
  UpdateSnackPayload,
  snackDetailResponseSchema,
  snackListResponseSchema,
} from "@/lib/api/snack-contracts";
import type { RestockSnackPayload } from "@/lib/api/snack-contracts";
import {
  ApiClientError,
  requestJson,
  requestVoid,
} from "@/lib/api/client";

export type CreateSnackInput = CreateSnackPayload;
export type GetSnacksParams = Partial<SnackListQuery>;
export type UpdateSnackInput = UpdateSnackPayload;

export async function fetchSnacks(
  params: Partial<GetSnacksParams> = {}
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
    newArrivals: params.newArrivals ? "true" : undefined,
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

export async function createSnack(input: CreateSnackInput) {
  const response = await requestJson("/api/snacks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return snackDetailResponseSchema.parse(response).snack;
}

export async function updateSnack(
  id: string,
  updates: UpdateSnackInput
) {
  const response = await requestJson(
    `/api/snacks/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  return snackDetailResponseSchema.parse(response).snack;
}

export async function deleteSnack(id: string): Promise<void> {
  await requestVoid(`/api/snacks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function consumeSnack(id: string) {
  const response = await requestJson(
    `/api/snacks/${encodeURIComponent(id)}/consume`,
    { method: "POST" }
  );
  return snackDetailResponseSchema.parse(response).snack;
}

export async function restockSnack(
  id: string,
  input: RestockSnackPayload
) {
  const response = await requestJson(
    `/api/snacks/${encodeURIComponent(id)}/restock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return snackDetailResponseSchema.parse(response).snack;
}
