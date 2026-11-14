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

export type SubmitSnackRequestInput = z.infer<
  typeof submitSnackRequestSchema
>;
export type MyRequestItem = z.infer<typeof myRequestItemSchema>;
