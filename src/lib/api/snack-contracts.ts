import { z } from "zod";

export const snackCategorySchema = z.enum([
  "sweet",
  "savoury",
  "drink",
  "healthy-ish",
]);

export const snackStatusSchema = z.enum(["stocked", "running_low", "gone"]);

export const snackSortSchema = z.enum([
  "name-asc",
  "name-desc",
  "votes-desc",
  "quantity-asc",
  "quantity-desc",
  "newest",
]);

export const snackListQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    category: snackCategorySchema.or(z.literal("all")).default("all"),
    status: snackStatusSchema.or(z.literal("all")).default("all"),
    sortBy: snackSortSchema.default("newest"),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .strict();

export const snackDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: snackCategorySchema,
  description: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  voteCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  arrivalUntil: z.string().datetime().optional(),
  priceInr: z.number().positive().optional(),
});

export const snackListResponseSchema = z.object({
  items: z.array(snackDtoSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const snackDetailResponseSchema = z.object({
  snack: snackDtoSchema,
});

export type SnackListQuery = z.infer<typeof snackListQuerySchema>;
export type SnackDto = z.infer<typeof snackDtoSchema>;
