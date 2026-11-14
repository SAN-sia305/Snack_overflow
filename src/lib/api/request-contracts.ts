import { z } from "zod";

export const submitSnackRequestSchema = z
  .object({
    productName: z.string().trim().min(2).max(60),
    expectedPriceInr: z
      .number()
      .positive()
      .max(5_000)
      .refine((value) => Number(value.toFixed(2)) === value, {
        message: "Expected price can have at most two decimal places.",
      }),
    note: z.string().trim().max(200).optional(),
  })
  .strict();

export const myRequestItemSchema = z.object({
  id: z.string(),
  productRequestId: z.string(),
  productName: z.string(),
  expectedPriceInr: z.number().positive(),
  note: z.string().optional(),
  createdAt: z.string().datetime(),
  status: z.enum(["requested", "approved", "rejected", "purchased", "available"]),
  decisionNote: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  purchasedAt: z.string().datetime().optional(),
  availableAt: z.string().datetime().optional(),
  linkedSnackId: z.string().optional(),
});

export const myRequestsResponseSchema = z.object({
  requests: z.array(myRequestItemSchema),
});

export const submitSnackRequestResponseSchema = z.object({
  request: myRequestItemSchema,
});

export const memberRequestDetailSchema = z.object({
  id: z.string(),
  productRequestId: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  expectedPriceInr: z.number().positive(),
  note: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const productRequestGroupSchema = z.object({
  id: z.string(),
  normalizedProductKey: z.string(),
  productName: z.string(),
  status: z.enum(["requested", "approved", "rejected", "purchased", "available"]),
  requests: z.array(memberRequestDetailSchema),
  distinctRequesterCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  decisionNote: z.string().optional(),
  purchasedAt: z.string().datetime().optional(),
  availableAt: z.string().datetime().optional(),
  linkedSnackId: z.string().optional(),
  actualQuantityAdded: z.number().int().optional(),
});

export const adminProductRequestsResponseSchema = z.object({
  requests: z.array(productRequestGroupSchema),
});

export const updateProductRequestStatusSchema = z
  .object({
    status: z.enum(["approved", "rejected", "purchased"]),
    decisionNote: z.string().trim().max(300).optional(),
  })
  .strict();

export const addPurchasedToInventorySchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    category: z.enum(["sweet", "savoury", "drink", "healthy-ish"]),
    description: z.string().trim().max(300).default(""),
    quantity: z.number().int().positive(),
    lowStockThreshold: z.number().int().nonnegative().default(5),
    imageUrl: z.string().trim().url(),
    priceInr: z.number().positive().max(5_000).optional(),
  })
  .strict();

export type SubmitSnackRequestInput = z.infer<
  typeof submitSnackRequestSchema
>;
export type MyRequestItem = z.infer<typeof myRequestItemSchema>;
export type MemberRequestDetail = z.infer<typeof memberRequestDetailSchema>;
export type ProductRequestGroupDto = z.infer<typeof productRequestGroupSchema>;
export type UpdateProductRequestStatusInput = z.infer<
  typeof updateProductRequestStatusSchema
>;
export type AddPurchasedToInventoryPayload = z.infer<
  typeof addPurchasedToInventorySchema
>;
