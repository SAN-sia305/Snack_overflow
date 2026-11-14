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

const priceInrSchema = z
  .number()
  .positive()
  .max(99_999_999.99)
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: "Price can have at most two decimal places.",
  });

const snackFields = {
  name: z.string().trim().min(2).max(60),
  category: snackCategorySchema,
  description: z.string().trim().min(4).max(300),
  quantity: z.number().int().min(0).max(2_147_483_647),
  lowStockThreshold: z.number().int().min(0).max(2_147_483_647),
  imageUrl: z.string().trim().url().max(2048),
};

export const createSnackSchema = z
  .object({
    ...snackFields,
    priceInr: priceInrSchema.optional(),
  })
  .strict();

export const updateSnackSchema = z
  .object({
    ...snackFields,
    priceInr: priceInrSchema.nullable().optional(),
  })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided.",
  });

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
export type CreateSnackPayload = z.infer<typeof createSnackSchema>;
export type UpdateSnackPayload = z.infer<typeof updateSnackSchema>;
