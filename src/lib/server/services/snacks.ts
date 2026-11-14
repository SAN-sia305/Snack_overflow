import { Prisma, SnackCategory } from "@prisma/client";
import {
  CreateSnackPayload,
  SnackDto,
  SnackListQuery,
  UpdateSnackPayload,
} from "@/lib/api/snack-contracts";
import type { RestockSnackPayload } from "@/lib/api/snack-contracts";
import {
  consumeSnack as consumeSnackRecord,
  createSnack as createSnackRecord,
  deleteSnack as deleteSnackRecord,
  findVoteSnackIdsByUser,
  findRequestGroupLinkedToSnack,
  findSnackById,
  findSnacks,
  restockSnack as restockSnackRecord,
  SnackRecord,
  toggleSnackVote as toggleSnackVoteRecord,
  updateSnack as updateSnackRecord,
} from "@/lib/server/repositories/snacks";
import { ApiError } from "@/lib/server/api-response";
import { normalizeName } from "@/lib/domain/normalize";

const categoryMap: Record<SnackCategory, SnackDto["category"]> = {
  SWEET: "sweet",
  SAVOURY: "savoury",
  DRINK: "drink",
  HEALTHY_ISH: "healthy-ish",
};

const databaseCategoryMap: Record<SnackDto["category"], SnackCategory> = {
  sweet: SnackCategory.SWEET,
  savoury: SnackCategory.SAVOURY,
  drink: SnackCategory.DRINK,
  "healthy-ish": SnackCategory.HEALTHY_ISH,
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

export async function createSnack(
  input: CreateSnackPayload,
  actorUserId: string
): Promise<SnackDto> {
  const record = await createSnackRecord(
    {
      name: input.name,
      normalizedName: normalizeName(input.name),
      category: databaseCategoryMap[input.category],
      description: input.description,
      imageUrl: input.imageUrl,
      quantity: input.quantity,
      lowStockThreshold: input.lowStockThreshold,
      priceInr:
        input.priceInr === undefined
          ? null
          : new Prisma.Decimal(input.priceInr),
    },
    actorUserId
  );
  return toSnackDto(record);
}

export async function updateSnack(
  id: string,
  input: UpdateSnackPayload
): Promise<SnackDto> {
  const data: Prisma.SnackUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
    data.normalizedName = normalizeName(input.name);
  }
  if (input.category !== undefined) {
    data.category = databaseCategoryMap[input.category];
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.imageUrl !== undefined) {
    data.imageUrl = input.imageUrl;
  }
  if (input.quantity !== undefined) {
    data.quantity = input.quantity;
  }
  if (input.lowStockThreshold !== undefined) {
    data.lowStockThreshold = input.lowStockThreshold;
  }
  if (input.priceInr !== undefined) {
    data.priceInr =
      input.priceInr === null
        ? null
        : new Prisma.Decimal(input.priceInr);
  }

  const record = await updateSnackRecord(id, data);
  return toSnackDto(record);
}

export async function deleteSnack(id: string): Promise<void> {
  const linkedRequestGroup = await findRequestGroupLinkedToSnack(id);
  if (linkedRequestGroup) {
    throw new ApiError(
      "SNACK_LINKED_TO_REQUEST",
      "This snack is linked to an available request and cannot be deleted.",
      409
    );
  }

  await deleteSnackRecord(id);
}

export async function consumeSnack(
  id: string,
  actorUserId: string
): Promise<SnackDto> {
  const result = await consumeSnackRecord(id, actorUserId);
  if (result.kind === "not_found") {
    throw new ApiError("NOT_FOUND", "Snack was not found.", 404);
  }
  if (result.kind === "out_of_stock") {
    throw new ApiError(
      "STOCK_CONFLICT",
      "Someone beat you to the last packet. Better luck next time.",
      409
    );
  }

  return toSnackDto(result.snack);
}

export async function restockSnack(
  id: string,
  input: RestockSnackPayload,
  actorUserId: string
): Promise<SnackDto> {
  const result = await restockSnackRecord(
    id,
    input.quantity,
    input.note,
    actorUserId
  );
  if (result.kind === "not_found") {
    throw new ApiError("NOT_FOUND", "Snack was not found.", 404);
  }
  if (result.kind === "quantity_limit") {
    throw new ApiError(
      "QUANTITY_LIMIT_EXCEEDED",
      "The requested restock would exceed the maximum stock quantity.",
      409
    );
  }

  return toSnackDto(result.snack);
}

export function getUserVoteSnackIds(userId: string): Promise<string[]> {
  return findVoteSnackIdsByUser(userId);
}

export async function toggleSnackVote(
  snackId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }> {
  const result = await toggleSnackVoteRecord(snackId, userId);
  if (result.kind === "not_found") {
    throw new ApiError("NOT_FOUND", "Snack was not found.", 404);
  }

  return { voted: result.voted, newCount: result.newCount };
}
