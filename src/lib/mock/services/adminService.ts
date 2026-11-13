import {
  ProductRequestStatus,
  Snack,
  SnackCategory,
  SnackProductRequest,
} from "@/types";
import { mockStore, getStockStatus } from "../store";
import { simulateLatency } from "../latency";
import { snackService } from "./snackService";
import { SEED_USERS } from "../data/users";

export interface AdminSummaryData {
  totalSnacks: number;
  stockedCount: number;
  runningLowCount: number;
  goneCount: number;
  pendingRequestsCount: number;
  totalVotes: number;
}

export interface AddPurchasedToInventoryInput {
  name: string;
  category: SnackCategory;
  description: string;
  quantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  priceInr?: number;
}

export const adminService = {
  /**
   * Retrieves product-level requests aggregated by product and ranked by distinct requester count.
   */
  async getProductRequests(
    statusFilter?: ProductRequestStatus | "all"
  ): Promise<SnackProductRequest[]> {
    await simulateLatency(120, 250);
    const { productRequests } = mockStore.get();

    let list = productRequests.map((request) => {
      const verifiedRequesterIds = new Set(
        request.requests
          .filter((memberRequest) => {
            const user = SEED_USERS.find(
              (candidate) => candidate.id === memberRequest.userId
            );
            return user ? user.isVerified : true;
          })
          .map((memberRequest) => memberRequest.userId)
      );
      return {
        ...request,
        requests: [...request.requests],
        distinctRequesterCount: verifiedRequesterIds.size,
      };
    });

    if (statusFilter && statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Deterministic ranking:
    // 1. Distinct requester count (highest first)
    // 2. Most recently updated/created first
    // 3. Product name alphabetically
    return list.sort((a, b) => {
      if (b.distinctRequesterCount !== a.distinctRequesterCount) {
        return b.distinctRequesterCount - a.distinctRequesterCount;
      }
      const timeDiff =
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.productName.localeCompare(b.productName);
    });
  },

  /**
   * Product-level status lifecycle transitions.
   */
  async updateProductRequestStatus(
    productRequestId: string,
    newStatus: ProductRequestStatus,
    decisionNote?: string,
    adminId = "usr_admin_1"
  ): Promise<SnackProductRequest> {
    await simulateLatency(180, 300);
    const { productRequests } = mockStore.get();
    const group = productRequests.find((g) => g.id === productRequestId);

    if (!group) {
      throw new Error("Product request not found.");
    }

    const currentStatus = group.status;

    // Validate allowed transitions
    const isAllowed =
      (currentStatus === "requested" &&
        (newStatus === "approved" || newStatus === "rejected")) ||
      (currentStatus === "approved" && newStatus === "purchased");

    if (!isAllowed) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}".`
      );
    }

    group.status = newStatus;
    group.reviewedBy = adminId;
    group.reviewedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();

    if (decisionNote) {
      group.decisionNote = decisionNote.trim();
    }

    if (newStatus === "purchased") {
      group.purchasedAt = new Date().toISOString();
    }

    mockStore.updateRequests(() => [...productRequests]);
    return { ...group };
  },

  /**
   * Finalizes the Purchase-to-Inventory flow:
   * Adds the purchased product to pantry inventory, creates New Arrival badge,
   * links the snack to the product request, and marks product request as Available.
   */
  async addPurchasedToInventory(
    productRequestId: string,
    snackData: AddPurchasedToInventoryInput
  ): Promise<{ snack: Snack; productRequest: SnackProductRequest }> {
    await simulateLatency(220, 380);
    const { productRequests } = mockStore.get();
    const group = productRequests.find((g) => g.id === productRequestId);

    if (!group) {
      throw new Error("Product request not found.");
    }

    if (group.status !== "purchased") {
      throw new Error(
        `Product must be in "purchased" status before adding to inventory. Current status: ${group.status}`
      );
    }

    if (group.linkedSnackId) {
      throw new Error("This product request is already linked to pantry inventory.");
    }

    if (!snackData.name.trim()) {
      throw new Error("Snack name is required.");
    }
    if (!Number.isInteger(snackData.quantity) || snackData.quantity <= 0) {
      throw new Error("Arrival quantity must be a positive whole number.");
    }
    if (
      !Number.isInteger(snackData.lowStockThreshold) ||
      snackData.lowStockThreshold < 0
    ) {
      throw new Error("Low-stock threshold must be a non-negative whole number.");
    }

    // 1. Create the new Snack in pantry inventory
    const createdSnack = await snackService.createSnack({
      name: snackData.name,
      category: snackData.category,
      description: snackData.description,
      quantity: snackData.quantity,
      lowStockThreshold: snackData.lowStockThreshold,
      imageUrl: snackData.imageUrl,
      priceInr: snackData.priceInr,
    });

    // Mark as New Arrival for 7 days
    const sevenDaysAhead = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    createdSnack.arrivalUntil = sevenDaysAhead;

    // 2. Update product request to Available
    group.status = "available";
    group.availableAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();
    group.linkedSnackId = createdSnack.id;
    group.actualQuantityAdded = snackData.quantity;

    mockStore.updateRequests(() => [...productRequests]);
    mockStore.updateSnacks((snacks) =>
      snacks.map((s) => (s.id === createdSnack.id ? createdSnack : s))
    );

    return { snack: createdSnack, productRequest: { ...group } };
  },

  /**
   * Computes Admin operational dashboard summary counts.
   */
  async getAdminSummary(): Promise<AdminSummaryData> {
    await simulateLatency(100, 200);
    const { snacks, productRequests } = mockStore.get();

    let stockedCount = 0;
    let runningLowCount = 0;
    let goneCount = 0;
    let totalVotes = 0;

    for (const snack of snacks) {
      totalVotes += snack.voteCount;
      const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
      if (status === "stocked") stockedCount++;
      else if (status === "running_low") runningLowCount++;
      else if (status === "gone") goneCount++;
    }

    const pendingRequestsCount = productRequests.filter(
      (r) => r.status === "requested"
    ).length;

    return {
      totalSnacks: snacks.length,
      stockedCount,
      runningLowCount,
      goneCount,
      pendingRequestsCount,
      totalVotes,
    };
  },

  /**
   * Actionable Admin Smart Alerts (low-stock alert & pending-requests alert).
   */
  async getAdminAlerts(): Promise<{
    lowStockAlert: { count: number; items: Snack[] };
    pendingRequestsAlert: { count: number; items: SnackProductRequest[] };
  }> {
    await simulateLatency(100, 200);
    const { snacks, productRequests } = mockStore.get();

    const lowStockSnacks = snacks.filter(
      (s) => getStockStatus(s.quantity, s.lowStockThreshold) === "running_low"
    );

    const pendingRequests = productRequests
      .filter((r) => r.status === "requested")
      .sort((a, b) => b.distinctRequesterCount - a.distinctRequesterCount);

    return {
      lowStockAlert: {
        count: lowStockSnacks.length,
        items: lowStockSnacks.slice(0, 3),
      },
      pendingRequestsAlert: {
        count: pendingRequests.length,
        items: pendingRequests.slice(0, 3),
      },
    };
  },
};
