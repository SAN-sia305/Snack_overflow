import { MemberSnackRequest, ProductRequestStatus, SnackProductRequest, User } from "@/types";
import { mockStore, normalizeProductKey } from "../store";
import { simulateLatency } from "../latency";
import { SEED_USERS } from "../data/users";

export interface SubmitSnackRequestInput {
  productName: string;
  expectedPriceInr: number;
  note?: string;
}

export interface MyRequestItem {
  id: string;
  productRequestId: string;
  productName: string;
  expectedPriceInr: number;
  note?: string;
  createdAt: string;
  status: ProductRequestStatus;
  decisionNote?: string;
  reviewedAt?: string;
  purchasedAt?: string;
  availableAt?: string;
  linkedSnackId?: string;
}

export const snackRequestService = {
  /**
   * Retrieves strictly the active member's own requests.
   * Product-level status is joined, but requester counts and other users' details are hidden.
   */
  async getMyRequests(userId: string): Promise<MyRequestItem[]> {
    await simulateLatency(120, 250);
    const { productRequests } = mockStore.get();

    const myItems: MyRequestItem[] = [];

    for (const group of productRequests) {
      const userReq = group.requests.find((r) => r.userId === userId);
      if (userReq) {
        myItems.push({
          id: userReq.id,
          productRequestId: group.id,
          productName: group.productName,
          expectedPriceInr: userReq.expectedPriceInr,
          note: userReq.note,
          createdAt: userReq.createdAt,
          status: group.status,
          decisionNote: group.decisionNote,
          reviewedAt: group.reviewedAt,
          purchasedAt: group.purchasedAt,
          availableAt: group.availableAt,
          linkedSnackId: group.linkedSnackId,
        });
      }
    }

    // Sort newest first
    return myItems.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Submits a snack request on behalf of a member.
   * Normalizes product name and rejects duplicate requests by the same member for that product.
   */
  async submitRequest(
    userId: string,
    input: SubmitSnackRequestInput
  ): Promise<MyRequestItem> {
    await simulateLatency(180, 320);

    const trimmedName = input.productName.trim();
    if (!trimmedName) {
      throw new Error("Snack name is required.");
    }

    if (
      !Number.isFinite(input.expectedPriceInr) ||
      input.expectedPriceInr <= 0
    ) {
      throw new Error("Expected price must be a positive amount in INR.");
    }

    const normalizedKey = normalizeProductKey(trimmedName);
    const { productRequests } = mockStore.get();

    // Check if product group exists
    let group = productRequests.find(
      (g) => g.normalizedProductKey === normalizedKey
    );

    if (group) {
      // Check if this member has already requested this product
      const alreadyRequested = group.requests.some((r) => r.userId === userId);
      if (alreadyRequested) {
        throw new Error(
          `You have already submitted a request for "${group.productName}". You can track its progress in My Requests.`
        );
      }
    }

    // Look up user details
    const user = SEED_USERS.find((u) => u.id === userId);
    const userName = user?.name || "Employee";

    const memberReq: MemberSnackRequest = {
      id: "mem_req_" + Math.random().toString(36).substring(2, 9),
      productRequestId: group?.id || "",
      userId,
      userName,
      expectedPriceInr: Math.floor(input.expectedPriceInr),
      note: input.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (group) {
      // Append request to existing group
      memberReq.productRequestId = group.id;
      group.requests.push(memberReq);

      // Recalculate distinct verified requesters
      const verifiedRequesterIds = new Set(
        group.requests
          .filter((r) => {
            const u = SEED_USERS.find((usr) => usr.id === r.userId);
            return u ? u.isVerified : true;
          })
          .map((r) => r.userId)
      );
      group.distinctRequesterCount = verifiedRequesterIds.size;
      group.updatedAt = new Date().toISOString();

      mockStore.updateRequests((prev) => [...prev]);
    } else {
      // Create new product group
      const newGroup: SnackProductRequest = {
        id: "req_group_" + Math.random().toString(36).substring(2, 9),
        normalizedProductKey: normalizedKey,
        productName: trimmedName,
        status: "requested",
        distinctRequesterCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requests: [],
      };
      memberReq.productRequestId = newGroup.id;
      newGroup.requests.push(memberReq);

      mockStore.updateRequests((prev) => [newGroup, ...prev]);
      group = newGroup;
    }

    return {
      id: memberReq.id,
      productRequestId: group.id,
      productName: group.productName,
      expectedPriceInr: memberReq.expectedPriceInr,
      note: memberReq.note,
      createdAt: memberReq.createdAt,
      status: group.status,
      decisionNote: group.decisionNote,
      reviewedAt: group.reviewedAt,
      purchasedAt: group.purchasedAt,
      availableAt: group.availableAt,
      linkedSnackId: group.linkedSnackId,
    };
  },
};
