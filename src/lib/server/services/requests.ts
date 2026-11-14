import { ProductRequestStatus as DatabaseRequestStatus } from "@prisma/client";
import type {
  MyRequestItem,
  SubmitSnackRequestInput,
} from "@/lib/api/request-contracts";
import {
  findMyRequests,
  MyRequestRecord,
  submitMemberRequest,
} from "@/lib/server/repositories/requests";
import { ApiError } from "@/lib/server/api-response";

const statusMap: Record<DatabaseRequestStatus, MyRequestItem["status"]> = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PURCHASED: "purchased",
  AVAILABLE: "available",
};

function toMyRequestItem(record: MyRequestRecord): MyRequestItem {
  const group = record.group;
  return {
    id: record.id,
    productRequestId: record.groupId,
    productName: group.productName,
    expectedPriceInr: Number(record.expectedPriceInr),
    createdAt: record.createdAt.toISOString(),
    status: statusMap[group.status],
    ...(record.note ? { note: record.note } : {}),
    ...(group.decisionNote ? { decisionNote: group.decisionNote } : {}),
    ...(group.reviewedAt
      ? { reviewedAt: group.reviewedAt.toISOString() }
      : {}),
    ...(group.purchasedAt
      ? { purchasedAt: group.purchasedAt.toISOString() }
      : {}),
    ...(group.availableAt
      ? { availableAt: group.availableAt.toISOString() }
      : {}),
    ...(group.linkedSnackId ? { linkedSnackId: group.linkedSnackId } : {}),
  };
}

export async function getMyRequests(userId: string): Promise<MyRequestItem[]> {
  const records = await findMyRequests(userId);
  return records.map(toMyRequestItem);
}

export async function submitMyRequest(
  userId: string,
  input: SubmitSnackRequestInput
): Promise<MyRequestItem> {
  const result = await submitMemberRequest(userId, input);
  if (result.kind === "duplicate") {
    throw new ApiError(
      "DUPLICATE_REQUEST",
      `You have already submitted a request for "${result.productName}". You can track its progress in My Requests.`,
      409
    );
  }

  return toMyRequestItem(result.request);
}
