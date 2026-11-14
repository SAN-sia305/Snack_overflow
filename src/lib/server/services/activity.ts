import { ActivityAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { Activity, UserRole } from "@/types";

export interface GetActivitiesQuery {
  action?: string;
  snackId?: string;
  limit?: number;
}

const actionMap: Record<ActivityAction, Activity["action"]> = {
  CONSUMED: "consumed",
  RESTOCKED: "restocked",
  REQUEST_APPROVED: "restocked",
  REQUEST_REJECTED: "restocked",
  REQUEST_PURCHASED: "restocked",
  REQUEST_AVAILABLE: "restocked",
};

export async function listActivities(
  query: GetActivitiesQuery
): Promise<Activity[]> {
  const where: Prisma.ActivityWhereInput = {};

  if (query.snackId) {
    where.snackId = query.snackId;
  }

  if (query.action && query.action !== "all") {
    if (query.action === "consumed") {
      where.action = ActivityAction.CONSUMED;
    } else if (query.action === "restocked") {
      where.action = {
        in: [
          ActivityAction.RESTOCKED,
          ActivityAction.REQUEST_APPROVED,
          ActivityAction.REQUEST_REJECTED,
          ActivityAction.REQUEST_PURCHASED,
          ActivityAction.REQUEST_AVAILABLE,
        ],
      };
    }
  }

  const records = await prisma.activity.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit && query.limit > 0 ? query.limit : 50,
  });

  return records.map((record) => ({
    id: record.id,
    userId: record.actorUserId,
    userName: record.actor.name,
    userRole: record.actor.role.toLowerCase() as UserRole,
    snackId: record.snackId ?? record.groupId ?? "",
    snackName: record.snackName,
    action: actionMap[record.action],
    amount: record.amount ?? 1,
    ...(record.note ? { note: record.note } : {}),
    createdAt: record.createdAt.toISOString(),
  }));
}

