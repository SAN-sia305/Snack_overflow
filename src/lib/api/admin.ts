import { requestJson } from "@/lib/api/client";
import { AdminAlertsData, AdminSummaryData } from "@/lib/server/services/admin";
import { Activity, ActivityAction } from "@/types";
import { z } from "zod";

export interface GetActivitiesParams {
  action?: ActivityAction | "all";
  snackId?: string;
  limit?: number;
}

export async function fetchAdminSummary(): Promise<AdminSummaryData> {
  const response = await requestJson("/api/admin/summary");
  return response as AdminSummaryData;
}

export async function fetchAdminAlerts(): Promise<AdminAlertsData> {
  const response = await requestJson("/api/admin/alerts");
  return response as AdminAlertsData;
}

export async function fetchAdminActivities(
  params: GetActivitiesParams = {}
): Promise<Activity[]> {
  const searchParams = new URLSearchParams();
  if (params.action && params.action !== "all") {
    searchParams.set("action", params.action);
  }
  if (params.snackId) {
    searchParams.set("snackId", params.snackId);
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await requestJson(`/api/activity${query}`);
  const parsed = z.object({ activities: z.array(z.any()) }).parse(response);
  return parsed.activities as Activity[];
}

