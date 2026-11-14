import { requestJson } from "@/lib/api/client";
import {
  myRequestsResponseSchema,
  submitSnackRequestResponseSchema,
} from "@/lib/api/request-contracts";
import type { SubmitSnackRequestInput } from "@/lib/api/request-contracts";

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
