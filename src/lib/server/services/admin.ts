import {
  ProductRequestStatus as DatabaseRequestStatus,
  SnackCategory as DatabaseCategory,
} from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { Snack, SnackProductRequest } from "@/types";
import { toProductRequestGroupDto } from "@/lib/server/services/requests";

export interface AdminSummaryData {
  totalSnacks: number;
  stockedCount: number;
  runningLowCount: number;
  goneCount: number;
  pendingRequestsCount: number;
  totalVotes: number;
}

export interface AdminAlertsData {
  lowStockAlert: {
    count: number;
    items: Snack[];
  };
  pendingRequestsAlert: {
    count: number;
    items: SnackProductRequest[];
  };
}

const categoryMap: Record<DatabaseCategory, Snack["category"]> = {
  SWEET: "sweet",
  SAVOURY: "savoury",
  DRINK: "drink",
  HEALTHY_ISH: "healthy-ish",
};

export async function getAdminSummary(): Promise<AdminSummaryData> {
  const [snacks, pendingRequestsCount, totalVotes] = await Promise.all([
    prisma.snack.findMany({
      select: {
        quantity: true,
        lowStockThreshold: true,
      },
    }),
    prisma.productRequestGroup.count({
      where: { status: DatabaseRequestStatus.REQUESTED },
    }),
    prisma.vote.count(),
  ]);

  let stockedCount = 0;
  let runningLowCount = 0;
  let goneCount = 0;

  for (const s of snacks) {
    if (s.quantity === 0) {
      goneCount++;
    } else if (s.quantity <= s.lowStockThreshold) {
      runningLowCount++;
    } else {
      stockedCount++;
    }
  }

  return {
    totalSnacks: snacks.length,
    stockedCount,
    runningLowCount,
    goneCount,
    pendingRequestsCount,
    totalVotes,
  };
}

export async function getAdminAlerts(): Promise<AdminAlertsData> {
  const [allSnacks, pendingGroups] = await Promise.all([
    prisma.snack.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    }),
    prisma.productRequestGroup.findMany({
      where: { status: DatabaseRequestStatus.REQUESTED },
      include: {
        reviewedBy: {
          select: { id: true, name: true },
        },
        requests: {
          include: {
            user: {
              select: { id: true, name: true, isVerified: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
  ]);

  const lowStockSnacks = allSnacks
    .filter((s) => s.quantity > 0 && s.quantity <= s.lowStockThreshold)
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: categoryMap[s.category],
      description: s.description,
      imageUrl: s.imageUrl,
      quantity: s.quantity,
      lowStockThreshold: s.lowStockThreshold,
      voteCount: s._count.votes,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      arrivalUntil: s.arrivalUntil?.toISOString(),
      priceInr: s.priceInr ? Number(s.priceInr) : undefined,
    }));

  const pendingDtos = pendingGroups.map(toProductRequestGroupDto);
  pendingDtos.sort((a, b) => b.distinctRequesterCount - a.distinctRequesterCount);

  return {
    lowStockAlert: {
      count: lowStockSnacks.length,
      items: lowStockSnacks.slice(0, 3),
    },
    pendingRequestsAlert: {
      count: pendingDtos.length,
      items: pendingDtos.slice(0, 3) as SnackProductRequest[],
    },
  };
}
