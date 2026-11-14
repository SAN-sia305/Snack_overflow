import { SnackCategory } from "@prisma/client";
import { SnackDto, SnackListQuery } from "@/lib/api/snack-contracts";
import {
  findSnackById,
  findSnacks,
  SnackRecord,
} from "@/lib/server/repositories/snacks";

const categoryMap: Record<SnackCategory, SnackDto["category"]> = {
  SWEET: "sweet",
  SAVOURY: "savoury",
  DRINK: "drink",
  HEALTHY_ISH: "healthy-ish",
};

function toSnackDto(snack: SnackRecord): SnackDto {
  return {
    id: snack.id,
    name: snack.name,
    category: categoryMap[snack.category],
    description: snack.description,
    imageUrl: snack.imageUrl,
    quantity: snack.quantity,
    lowStockThreshold: snack.lowStockThreshold,
    voteCount: snack._count.votes,
    createdAt: snack.createdAt.toISOString(),
    updatedAt: snack.updatedAt.toISOString(),
    ...(snack.arrivalUntil
      ? { arrivalUntil: snack.arrivalUntil.toISOString() }
      : {}),
    ...(snack.priceInr !== null ? { priceInr: Number(snack.priceInr) } : {}),
  };
}

export async function listSnacks(query: SnackListQuery) {
  const { records, total } = await findSnacks(query);
  return {
    items: records.map(toSnackDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getSnack(id: string): Promise<SnackDto | null> {
  const snack = await findSnackById(id);
  return snack ? toSnackDto(snack) : null;
}
