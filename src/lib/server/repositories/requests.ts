import { Prisma } from "@prisma/client";
import type { SubmitSnackRequestInput } from "@/lib/api/request-contracts";
import { prisma } from "@/lib/server/prisma";
import { normalizeName } from "@/lib/domain/normalize";

const requestGroupSelect = {
  id: true,
  productName: true,
  status: true,
  decisionNote: true,
  reviewedAt: true,
  purchasedAt: true,
  availableAt: true,
  linkedSnackId: true,
} satisfies Prisma.ProductRequestGroupSelect;

const myRequestSelect = {
  id: true,
  groupId: true,
  expectedPriceInr: true,
  note: true,
  createdAt: true,
  group: { select: requestGroupSelect },
} satisfies Prisma.MemberSnackRequestSelect;

export type MyRequestRecord = Prisma.MemberSnackRequestGetPayload<{
  select: typeof myRequestSelect;
}>;

export type SubmitMemberRequestResult =
  | { kind: "created"; request: MyRequestRecord }
  | { kind: "duplicate"; productName: string };

export function findMyRequests(userId: string): Promise<MyRequestRecord[]> {
  return prisma.memberSnackRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: myRequestSelect,
  });
}

export async function submitMemberRequest(
  userId: string,
  input: SubmitSnackRequestInput
): Promise<SubmitMemberRequestResult> {
  const normalizedName = normalizeName(input.productName);

  return prisma.$transaction(async (transaction) => {
    const existingGroup = await transaction.productRequestGroup.findUnique({
      where: { normalizedName },
      select: { id: true, productName: true },
    });

    if (existingGroup) {
      const existingRequest =
        await transaction.memberSnackRequest.findUnique({
          where: {
            groupId_userId: {
              groupId: existingGroup.id,
              userId,
            },
          },
          select: { id: true },
        });
      if (existingRequest) {
        return {
          kind: "duplicate",
          productName: existingGroup.productName,
        };
      }
    }

    const group = await transaction.productRequestGroup.upsert({
      where: { normalizedName },
      create: {
        normalizedName,
        productName: input.productName,
      },
      update: { updatedAt: new Date() },
      select: { id: true, productName: true },
    });

    const duplicateRequest =
      await transaction.memberSnackRequest.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
        select: { id: true },
      });
    if (duplicateRequest) {
      return { kind: "duplicate", productName: group.productName };
    }

    const request = await transaction.memberSnackRequest.create({
      data: {
        groupId: group.id,
        userId,
        expectedPriceInr: new Prisma.Decimal(input.expectedPriceInr),
        note: input.note?.trim() || null,
      },
      select: myRequestSelect,
    });

    return { kind: "created", request };
  });
}
