import { ActivityAction, Prisma, ProductRequestStatus, SnackCategory } from "@prisma/client";
import type {
  AddPurchasedToInventoryPayload,
  SubmitSnackRequestInput,
  UpdateProductRequestStatusInput,
} from "@/lib/api/request-contracts";
import { prisma } from "@/lib/server/prisma";
import { normalizeName } from "@/lib/domain/normalize";

const requestGroupSelect = {
  id: true,
  productName: true,
  status: true,
  decisionNote: true,
  reviewedAt: true,
  purchasedAt: true,
  availableAt: true,
  linkedSnackId: true,
} satisfies Prisma.ProductRequestGroupSelect;

const myRequestSelect = {
  id: true,
  groupId: true,
  expectedPriceInr: true,
  note: true,
  createdAt: true,
  group: { select: requestGroupSelect },
} satisfies Prisma.MemberSnackRequestSelect;

export type MyRequestRecord = Prisma.MemberSnackRequestGetPayload<{
  select: typeof myRequestSelect;
}>;

export type SubmitMemberRequestResult =
  | { kind: "created"; request: MyRequestRecord }
  | { kind: "duplicate"; productName: string };

const adminGroupSelect = {
  id: true,
  normalizedName: true,
  productName: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  decisionNote: true,
  purchasedAt: true,
  availableAt: true,
  actualQuantityAdded: true,
  linkedSnackId: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  requests: {
    select: {
      id: true,
      groupId: true,
      userId: true,
      expectedPriceInr: true,
      note: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          isVerified: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ProductRequestGroupSelect;

export type AdminProductRequestRecord = Prisma.ProductRequestGroupGetPayload<{
  select: typeof adminGroupSelect;
}>;

export function findMyRequests(userId: string): Promise<MyRequestRecord[]> {
  return prisma.memberSnackRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: myRequestSelect,
  });
}

export async function submitMemberRequest(
  userId: string,
  input: SubmitSnackRequestInput
): Promise<SubmitMemberRequestResult> {
  const normalizedName = normalizeName(input.productName);

  return prisma.$transaction(async (transaction) => {
    const existingGroup = await transaction.productRequestGroup.findUnique({
      where: { normalizedName },
      select: { id: true, productName: true },
    });

    if (existingGroup) {
      const existingRequest =
        await transaction.memberSnackRequest.findUnique({
          where: {
            groupId_userId: {
              groupId: existingGroup.id,
              userId,
            },
          },
          select: { id: true },
        });
      if (existingRequest) {
        return {
          kind: "duplicate",
          productName: existingGroup.productName,
        };
      }
    }

    const group = await transaction.productRequestGroup.upsert({
      where: { normalizedName },
      create: {
        normalizedName,
        productName: input.productName,
      },
      update: { updatedAt: new Date() },
      select: { id: true, productName: true },
    });

    const duplicateRequest =
      await transaction.memberSnackRequest.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
        select: { id: true },
      });
    if (duplicateRequest) {
      return { kind: "duplicate", productName: group.productName };
    }

    const request = await transaction.memberSnackRequest.create({
      data: {
        groupId: group.id,
        userId,
        expectedPriceInr: new Prisma.Decimal(input.expectedPriceInr),
        note: input.note?.trim() || null,
      },
      select: myRequestSelect,
    });

    return { kind: "created", request };
  });
}

export function findAllProductRequests(
  statusFilter?: ProductRequestStatus
): Promise<AdminProductRequestRecord[]> {
  return prisma.productRequestGroup.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    select: adminGroupSelect,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export function findProductRequestById(
  id: string
): Promise<AdminProductRequestRecord | null> {
  return prisma.productRequestGroup.findUnique({
    where: { id },
    select: adminGroupSelect,
  });
}

export async function updateRequestGroupStatus(
  groupId: string,
  adminUserId: string,
  input: UpdateProductRequestStatusInput
): Promise<AdminProductRequestRecord> {
  const now = new Date();
  const dbStatus = input.status.toUpperCase() as ProductRequestStatus;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.productRequestGroup.findUnique({
      where: { id: groupId },
      select: { id: true, status: true, productName: true },
    });

    if (!existing) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    // Validate state transitions
    const currentStatus = existing.status;
    const isAllowed =
      (currentStatus === ProductRequestStatus.REQUESTED &&
        (dbStatus === ProductRequestStatus.APPROVED ||
          dbStatus === ProductRequestStatus.REJECTED)) ||
      (currentStatus === ProductRequestStatus.APPROVED &&
        dbStatus === ProductRequestStatus.PURCHASED);

    if (!isAllowed) {
      throw new Error(`INVALID_TRANSITION:${currentStatus}->${dbStatus}`);
    }

    const updated = await tx.productRequestGroup.update({
      where: { id: groupId },
      data: {
        status: dbStatus,
        reviewedById: adminUserId,
        reviewedAt: now,
        decisionNote: input.decisionNote?.trim() || null,
        purchasedAt:
          dbStatus === ProductRequestStatus.PURCHASED ? now : undefined,
      },
      select: adminGroupSelect,
    });

    // Record activity
    let action: ActivityAction | null = null;
    if (dbStatus === ProductRequestStatus.APPROVED) {
      action = ActivityAction.REQUEST_APPROVED;
    } else if (dbStatus === ProductRequestStatus.REJECTED) {
      action = ActivityAction.REQUEST_REJECTED;
    } else if (dbStatus === ProductRequestStatus.PURCHASED) {
      action = ActivityAction.REQUEST_PURCHASED;
    }

    if (action) {
      await tx.activity.create({
        data: {
          actorUserId: adminUserId,
          action,
          groupId: existing.id,
          snackName: existing.productName,
          note: input.decisionNote?.trim() || null,
        },
      });
    }

    return updated;
  });
}

export async function addPurchasedProductToInventory(
  groupId: string,
  adminUserId: string,
  input: AddPurchasedToInventoryPayload
): Promise<{
  group: AdminProductRequestRecord;
  snackId: string;
}> {
  const normalizedSnackName = normalizeName(input.name);
  const now = new Date();
  const arrivalUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dbCategoryMap: Record<AddPurchasedToInventoryPayload["category"], SnackCategory> = {
    sweet: SnackCategory.SWEET,
    savoury: SnackCategory.SAVOURY,
    drink: SnackCategory.DRINK,
    "healthy-ish": SnackCategory.HEALTHY_ISH,
  };

  return prisma.$transaction(async (tx) => {
    const group = await tx.productRequestGroup.findUnique({
      where: { id: groupId },
      select: { id: true, status: true, linkedSnackId: true, productName: true },
    });

    if (!group) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    if (group.status !== ProductRequestStatus.PURCHASED) {
      throw new Error(`NOT_PURCHASED:${group.status}`);
    }

    if (group.linkedSnackId) {
      throw new Error("ALREADY_LINKED");
    }

    // Check if snack with normalizedName already exists
    const existingSnack = await tx.snack.findUnique({
      where: { normalizedName: normalizedSnackName },
      select: { id: true, quantity: true },
    });

    let snackId: string;

    if (existingSnack) {
      // Restock existing snack and extend new arrival
      const updatedSnack = await tx.snack.update({
        where: { id: existingSnack.id },
        data: {
          quantity: { increment: input.quantity },
          arrivalUntil,
          priceInr:
            input.priceInr !== undefined
              ? new Prisma.Decimal(input.priceInr)
              : undefined,
        },
        select: { id: true },
      });
      snackId = updatedSnack.id;
    } else {
      // Create new snack
      const createdSnack = await tx.snack.create({
        data: {
          name: input.name,
          normalizedName: normalizedSnackName,
          category: dbCategoryMap[input.category],
          description: input.description,
          imageUrl: input.imageUrl,
          quantity: input.quantity,
          lowStockThreshold: input.lowStockThreshold,
          priceInr:
            input.priceInr !== undefined
              ? new Prisma.Decimal(input.priceInr)
              : null,
          arrivalUntil,
        },
        select: { id: true },
      });
      snackId = createdSnack.id;
    }

    // Update group to AVAILABLE and link to snack
    const updatedGroup = await tx.productRequestGroup.update({
      where: { id: groupId },
      data: {
        status: ProductRequestStatus.AVAILABLE,
        availableAt: now,
        actualQuantityAdded: input.quantity,
        linkedSnackId: snackId,
      },
      select: adminGroupSelect,
    });

    // Record activity
    await tx.activity.create({
      data: {
        actorUserId: adminUserId,
        action: ActivityAction.REQUEST_AVAILABLE,
        snackId,
        groupId: group.id,
        snackName: input.name,
        amount: input.quantity,
      },
    });

    return { group: updatedGroup, snackId };
  });
}
