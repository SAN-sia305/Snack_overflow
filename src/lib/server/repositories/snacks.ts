import { Prisma } from "@prisma/client";
import { SnackCategory } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { SnackListQuery } from "@/lib/api/snack-contracts";

const categoryMap: Record<
  Exclude<SnackListQuery["category"], "all">,
  SnackCategory
> = {
  sweet: SnackCategory.SWEET,
  savoury: SnackCategory.SAVOURY,
  drink: SnackCategory.DRINK,
  "healthy-ish": SnackCategory.HEALTHY_ISH,
};

export function buildSnackWhere(
  query: SnackListQuery
): Prisma.SnackWhereInput {
  const where: Prisma.SnackWhereInput = {};
  const conditions: Prisma.SnackWhereInput[] = [];

  if (query.search) {
    conditions.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (query.newArrivals) {
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    conditions.push({
      OR: [
        { arrivalUntil: { gte: now } },
        { arrivalUntil: null, createdAt: { gte: recentCutoff } },
      ],
    });
  }

  if (conditions.length === 1) {
    Object.assign(where, conditions[0]);
  } else if (conditions.length > 1) {
    where.AND = conditions;
  }

  if (query.category !== "all") {
    where.category = categoryMap[query.category];
  }

  switch (query.status) {
    case "gone":
      where.quantity = 0;
      break;
    case "running_low":
      where.quantity = {
        gt: 0,
        lte: prisma.snack.fields.lowStockThreshold,
      };
      break;
    case "stocked":
      where.quantity = { gt: prisma.snack.fields.lowStockThreshold };
      break;
  }

  return where;
}

function getSnackOrderBy(
  sortBy: SnackListQuery["sortBy"]
): Prisma.SnackOrderByWithRelationInput[] {
  switch (sortBy) {
    case "name-asc":
      return [{ name: "asc" }, { id: "asc" }];
    case "name-desc":
      return [{ name: "desc" }, { id: "asc" }];
    case "votes-desc":
      return [{ votes: { _count: "desc" } }, { name: "asc" }, { id: "asc" }];
    case "quantity-asc":
      return [{ quantity: "asc" }, { id: "asc" }];
    case "quantity-desc":
      return [{ quantity: "desc" }, { id: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

const snackWithVoteCount = {
  _count: { select: { votes: true } },
} satisfies Prisma.SnackInclude;

export type SnackRecord = Prisma.SnackGetPayload<{
  include: typeof snackWithVoteCount;
}>;

export type ConsumeSnackResult =
  | { kind: "updated"; snack: SnackRecord }
  | { kind: "not_found" }
  | { kind: "out_of_stock" };

export type RestockSnackResult =
  | { kind: "updated"; snack: SnackRecord }
  | { kind: "not_found" }
  | { kind: "quantity_limit" };

export async function findSnacks(
  query: SnackListQuery
): Promise<{ records: SnackRecord[]; total: number }> {
  const where = buildSnackWhere(query);
  const [records, total] = await Promise.all([
    prisma.snack.findMany({
      where,
      orderBy: getSnackOrderBy(query.sortBy),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: snackWithVoteCount,
    }),
    prisma.snack.count({ where }),
  ]);

  return { records, total };
}

export function findSnackById(id: string) {
  return prisma.snack.findUnique({
    where: { id },
    include: snackWithVoteCount,
  });
}

export async function createSnack(
  data: Prisma.SnackCreateInput,
  actorUserId: string
): Promise<SnackRecord> {
  return prisma.$transaction(async (transaction) => {
    const snack = await transaction.snack.create({
      data,
      include: snackWithVoteCount,
    });

    if (snack.quantity > 0) {
      await transaction.activity.create({
        data: {
          actor: { connect: { id: actorUserId } },
          action: "RESTOCKED",
          snack: { connect: { id: snack.id } },
          snackName: snack.name,
          amount: snack.quantity,
          note: "Initial pantry inventory creation.",
        },
      });
    }

    return snack;
  });
}

export function updateSnack(
  id: string,
  data: Prisma.SnackUpdateInput
): Promise<SnackRecord> {
  return prisma.snack.update({
    where: { id },
    data,
    include: snackWithVoteCount,
  });
}

export function findRequestGroupLinkedToSnack(id: string) {
  return prisma.productRequestGroup.findUnique({
    where: { linkedSnackId: id },
    select: { id: true },
  });
}

export async function deleteSnack(id: string): Promise<void> {
  await prisma.snack.delete({ where: { id } });
}

export async function consumeSnack(
  id: string,
  actorUserId: string
): Promise<ConsumeSnackResult> {
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.snack.updateMany({
      where: { id, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });

    if (updated.count === 0) {
      const existing = await transaction.snack.findUnique({
        where: { id },
        select: { id: true },
      });
      return existing ? { kind: "out_of_stock" } : { kind: "not_found" };
    }

    const snack = await transaction.snack.findUnique({
      where: { id },
      include: snackWithVoteCount,
    });
    if (!snack) {
      throw new Error("Snack disappeared during the consume transaction.");
    }

    await transaction.activity.create({
      data: {
        actor: { connect: { id: actorUserId } },
        action: "CONSUMED",
        snack: { connect: { id } },
        snackName: snack.name,
        amount: 1,
      },
    });

    return { kind: "updated", snack };
  });
}

export async function restockSnack(
  id: string,
  quantity: number,
  note: string | undefined,
  actorUserId: string
): Promise<RestockSnackResult> {
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.snack.updateMany({
      where: {
        id,
        quantity: { lte: 2_147_483_647 - quantity },
      },
      data: { quantity: { increment: quantity } },
    });

    if (updated.count === 0) {
      const existing = await transaction.snack.findUnique({
        where: { id },
        select: { id: true },
      });
      return existing ? { kind: "quantity_limit" } : { kind: "not_found" };
    }

    const snack = await transaction.snack.findUnique({
      where: { id },
      include: snackWithVoteCount,
    });
    if (!snack) {
      throw new Error("Snack disappeared during the restock transaction.");
    }

    await transaction.activity.create({
      data: {
        actor: { connect: { id: actorUserId } },
        action: "RESTOCKED",
        snack: { connect: { id } },
        snackName: snack.name,
        amount: quantity,
        note: note?.trim() || null,
      },
    });

    return { kind: "updated", snack };
  });
}

export async function findVoteSnackIdsByUser(
  userId: string
): Promise<string[]> {
  const votes = await prisma.vote.findMany({
    where: { userId },
    select: { snackId: true },
    orderBy: { snackId: "asc" },
  });
  return votes.map((vote) => vote.snackId);
}

export type ToggleVoteResult =
  | { kind: "toggled"; voted: boolean; newCount: number }
  | { kind: "not_found" };

export async function toggleSnackVote(
  snackId: string,
  userId: string
): Promise<ToggleVoteResult> {
  return prisma.$transaction(async (transaction) => {
    const snack = await transaction.snack.findUnique({
      where: { id: snackId },
      select: { id: true },
    });
    if (!snack) {
      return { kind: "not_found" };
    }

    const existingVote = await transaction.vote.findUnique({
      where: { userId_snackId: { userId, snackId } },
      select: { id: true },
    });

    const voted = !existingVote;
    if (existingVote) {
      await transaction.vote.delete({ where: { id: existingVote.id } });
    } else {
      await transaction.vote.create({ data: { userId, snackId } });
    }

    const newCount = await transaction.vote.count({ where: { snackId } });
    return { kind: "toggled", voted, newCount };
  });
}
