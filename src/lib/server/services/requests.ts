import { ProductRequestStatus as DatabaseRequestStatus } from "@prisma/client";
import type {
  AddPurchasedToInventoryPayload,
  MyRequestItem,
  ProductRequestGroupDto,
  SubmitSnackRequestInput,
  UpdateProductRequestStatusInput,
} from "@/lib/api/request-contracts";
import {
  AdminProductRequestRecord,
  findAllProductRequests,
  findMyRequests,
  MyRequestRecord,
  submitMemberRequest,
  updateRequestGroupStatus,
  addPurchasedProductToInventory,
} from "@/lib/server/repositories/requests";
import { ApiError } from "@/lib/server/api-response";

const statusMap: Record<DatabaseRequestStatus, MyRequestItem["status"]> = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PURCHASED: "purchased",
  AVAILABLE: "available",
};

const databaseStatusMap: Record<string, DatabaseRequestStatus> = {
  requested: DatabaseRequestStatus.REQUESTED,
  approved: DatabaseRequestStatus.APPROVED,
  rejected: DatabaseRequestStatus.REJECTED,
  purchased: DatabaseRequestStatus.PURCHASED,
  available: DatabaseRequestStatus.AVAILABLE,
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

export function toProductRequestGroupDto(
  record: AdminProductRequestRecord
): ProductRequestGroupDto {
  // Compute distinct verified requester count
  const verifiedUserIds = new Set(
    record.requests
      .filter((r) => r.user.isVerified)
      .map((r) => r.userId)
  );

  return {
    id: record.id,
    normalizedProductKey: record.normalizedName,
    productName: record.productName,
    status: statusMap[record.status],
    distinctRequesterCount: verifiedUserIds.size,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    requests: record.requests.map((r) => ({
      id: r.id,
      productRequestId: r.groupId,
      userId: r.userId,
      userName: r.user.name,
      expectedPriceInr: Number(r.expectedPriceInr),
      ...(r.note ? { note: r.note } : {}),
      createdAt: r.createdAt.toISOString(),
    })),
    ...(record.reviewedBy ? { reviewedBy: record.reviewedBy.name } : {}),
    ...(record.reviewedAt ? { reviewedAt: record.reviewedAt.toISOString() } : {}),
    ...(record.decisionNote ? { decisionNote: record.decisionNote } : {}),
    ...(record.purchasedAt ? { purchasedAt: record.purchasedAt.toISOString() } : {}),
    ...(record.availableAt ? { availableAt: record.availableAt.toISOString() } : {}),
    ...(record.linkedSnackId ? { linkedSnackId: record.linkedSnackId } : {}),
    ...(record.actualQuantityAdded !== null
      ? { actualQuantityAdded: record.actualQuantityAdded }
      : {}),
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

export async function listAdminProductRequests(
  statusFilter?: string
): Promise<ProductRequestGroupDto[]> {
  const dbStatus =
    statusFilter && statusFilter !== "all"
      ? databaseStatusMap[statusFilter.toLowerCase()]
      : undefined;

  const records = await findAllProductRequests(dbStatus);
  const dtos = records.map(toProductRequestGroupDto);

  // Sort deterministically:
  // 1. Highest distinct requester count first
  // 2. Most recently updated
  // 3. Alphabetically by name
  return dtos.sort((a, b) => {
    if (b.distinctRequesterCount !== a.distinctRequesterCount) {
      return b.distinctRequesterCount - a.distinctRequesterCount;
    }
    const timeDiff =
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.productName.localeCompare(b.productName);
  });
}

export async function updateAdminProductRequestStatus(
  groupId: string,
  adminUserId: string,
  input: UpdateProductRequestStatusInput
): Promise<ProductRequestGroupDto> {
  try {
    const record = await updateRequestGroupStatus(groupId, adminUserId, input);
    return toProductRequestGroupDto(record);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "REQUEST_NOT_FOUND") {
        throw new ApiError("REQUEST_NOT_FOUND", "Product request not found.", 404);
      }
      if (err.message.startsWith("INVALID_TRANSITION")) {
        throw new ApiError(
          "INVALID_STATUS_TRANSITION",
          "This status transition is not allowed.",
          400
        );
      }
    }
    throw err;
  }
}

export async function addPurchasedToInventory(
  groupId: string,
  adminUserId: string,
  input: AddPurchasedToInventoryPayload
): Promise<{ group: ProductRequestGroupDto; snackId: string }> {
  try {
    const result = await addPurchasedProductToInventory(
      groupId,
      adminUserId,
      input
    );
    return {
      group: toProductRequestGroupDto(result.group),
      snackId: result.snackId,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "REQUEST_NOT_FOUND") {
        throw new ApiError("REQUEST_NOT_FOUND", "Product request not found.", 404);
      }
      if (err.message.startsWith("NOT_PURCHASED")) {
        throw new ApiError(
          "NOT_PURCHASED",
          "Product request must be in purchased status before adding to pantry.",
          400
        );
      }
      if (err.message === "ALREADY_LINKED") {
        throw new ApiError(
          "ALREADY_LINKED",
          "This product request is already linked to inventory.",
          409
        );
      }
    }
    throw err;
  }
}
