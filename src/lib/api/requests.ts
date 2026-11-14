import { requestJson } from "@/lib/api/client";
import {
  adminProductRequestsResponseSchema,
  myRequestsResponseSchema,
  productRequestGroupSchema,
  submitSnackRequestResponseSchema,
} from "@/lib/api/request-contracts";
import type {
  AddPurchasedToInventoryPayload,
  ProductRequestGroupDto,
  SubmitSnackRequestInput,
  UpdateProductRequestStatusInput,
} from "@/lib/api/request-contracts";
import { z } from "zod";

export async function fetchMyRequests() {
  const response = await requestJson("/api/requests/me");
  return myRequestsResponseSchema.parse(response).requests;
}

export async function submitSnackRequest(input: SubmitSnackRequestInput) {
  const response = await requestJson("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return submitSnackRequestResponseSchema.parse(response).request;
}

export async function fetchAdminProductRequests(statusFilter?: string) {
  const search =
    statusFilter && statusFilter !== "all"
      ? `?status=${encodeURIComponent(statusFilter)}`
      : "";
  const response = await requestJson(`/api/requests${search}`);
  return adminProductRequestsResponseSchema.parse(response).requests;
}

export async function updateProductRequestStatus(
  id: string,
  input: UpdateProductRequestStatusInput
): Promise<ProductRequestGroupDto> {
  const response = await requestJson(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const parsed = z.object({ request: productRequestGroupSchema }).parse(response);
  return parsed.request;
}

export async function addPurchasedToInventory(
  id: string,
  input: AddPurchasedToInventoryPayload
): Promise<{ productRequest: ProductRequestGroupDto; snackId: string }> {
  const response = await requestJson(`/api/requests/${id}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const parsed = z
    .object({
      productRequest: productRequestGroupSchema,
      snackId: z.string(),
    })
    .parse(response);
  return parsed;
}
