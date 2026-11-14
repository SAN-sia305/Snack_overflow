import argon2 from "argon2";
import { Prisma, PrismaClient } from "@prisma/client";
import { SEED_ACTIVITIES } from "../src/lib/mock/data/activities";
import { SEED_REQUESTS } from "../src/lib/mock/data/requests";
import { SEED_SNACKS } from "../src/lib/mock/data/snacks";
import { SEED_USERS } from "../src/lib/mock/data/users";

const prisma = new PrismaClient();

const roleMap = {
  admin: "ADMIN",
  member: "MEMBER",
} as const;

const categoryMap = {
  sweet: "SWEET",
  savoury: "SAVOURY",
  drink: "DRINK",
  "healthy-ish": "HEALTHY_ISH",
} as const;

const requestStatusMap = {
  requested: "REQUESTED",
  approved: "APPROVED",
  rejected: "REJECTED",
  purchased: "PURCHASED",
  available: "AVAILABLE",
} as const;

const activityActionMap = {
  consumed: "CONSUMED",
  restocked: "RESTOCKED",
} as const;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function seed(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const memberPassword = process.env.SEED_MEMBER_PASSWORD;
  if (!adminPassword || !memberPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD and SEED_MEMBER_PASSWORD must be set in .env.local."
    );
  }

  const adminHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  const memberHash = await argon2.hash(memberPassword, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.role === "admin" ? adminHash : memberHash,
        role: roleMap[user.role],
        isVerified: user.isVerified,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
      update: {},
    });
  }

  for (const snack of SEED_SNACKS) {
    await prisma.snack.upsert({
      where: { id: snack.id },
      create: {
        id: snack.id,
        name: snack.name,
        normalizedName: normalize(snack.name),
        category: categoryMap[snack.category],
        description: snack.description,
        imageUrl: snack.imageUrl,
        quantity: snack.quantity,
        lowStockThreshold: snack.lowStockThreshold,
        priceInr:
          snack.priceInr === undefined
            ? undefined
            : new Prisma.Decimal(snack.priceInr),
        arrivalUntil: snack.arrivalUntil
          ? new Date(snack.arrivalUntil)
          : null,
        createdAt: new Date(snack.createdAt),
        updatedAt: new Date(snack.updatedAt),
      },
      update: {},
    });
  }

  for (const [userId, snackIds] of Object.entries({
    usr_member_1: ["snack_1", "snack_2", "snack_3", "snack_7", "snack_9"],
    usr_member_2: ["snack_1", "snack_2", "snack_4", "snack_14"],
    usr_member_3: ["snack_1", "snack_3", "snack_6", "snack_7"],
    usr_member_4: ["snack_1", "snack_2", "snack_4"],
    usr_member_5: ["snack_2", "snack_3", "snack_9"],
  })) {
    await prisma.vote.createMany({
      data: snackIds.map((snackId) => ({ userId, snackId })),
      skipDuplicates: true,
    });
  }

  for (const group of SEED_REQUESTS) {
    await prisma.productRequestGroup.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
        normalizedName: group.normalizedProductKey,
        productName: group.productName,
        status: requestStatusMap[group.status],
        reviewedById: group.reviewedBy,
        reviewedAt: group.reviewedAt ? new Date(group.reviewedAt) : null,
        decisionNote: group.decisionNote,
        purchasedAt: group.purchasedAt ? new Date(group.purchasedAt) : null,
        availableAt: group.availableAt ? new Date(group.availableAt) : null,
        actualQuantityAdded: group.actualQuantityAdded,
        linkedSnackId: group.linkedSnackId,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt),
      },
      update: {},
    });
    await prisma.memberSnackRequest.createMany({
      data: group.requests.map((request) => ({
        id: request.id,
        groupId: group.id,
        userId: request.userId,
        expectedPriceInr: new Prisma.Decimal(request.expectedPriceInr),
        note: request.note,
        createdAt: new Date(request.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  await prisma.activity.createMany({
    data: SEED_ACTIVITIES.map((activity) => ({
      id: activity.id,
      actorUserId: activity.userId,
      action: activityActionMap[activity.action],
      snackId: activity.snackId,
      snackName: activity.snackName,
      amount: activity.amount,
      note: activity.note,
      createdAt: new Date(activity.createdAt),
    })),
    skipDuplicates: true,
  });

  console.log(
    `Seed complete: ${SEED_USERS.length} users, ${SEED_SNACKS.length} snacks, ${SEED_REQUESTS.length} request groups.`
  );
  console.log(
    "Local development accounts: admin@bipolarfactory.com and member@bipolarfactory.com; passwords are set privately in .env.local."
  );
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "Unexpected error.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
