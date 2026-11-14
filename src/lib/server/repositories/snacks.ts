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

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
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
