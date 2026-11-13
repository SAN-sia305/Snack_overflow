import { Activity, ActivityAction } from "@/types";
import { mockStore } from "../store";
import { simulateLatency } from "../latency";

export interface GetActivitiesParams {
  action?: ActivityAction | "all";
  snackId?: string;
  limit?: number;
}

export const activityService = {
  async getActivities(params: GetActivitiesParams = {}): Promise<Activity[]> {
    await simulateLatency(100, 220);
    const { activities } = mockStore.get();

    let list = [...activities];

    if (params.action && params.action !== "all") {
      list = list.filter((a) => a.action === params.action);
    }

    if (params.snackId) {
      list = list.filter((a) => a.snackId === params.snackId);
    }

    // Sort newest first
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (params.limit && params.limit > 0) {
      return list.slice(0, params.limit);
    }

    return list;
  },
};

