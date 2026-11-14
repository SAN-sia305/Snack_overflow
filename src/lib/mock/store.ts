import { Snack, SnackProductRequest, Activity } from "@/types";
import { SEED_SNACKS } from "./data/snacks";
import { SEED_REQUESTS } from "./data/requests";
import { SEED_ACTIVITIES } from "./data/activities";

const STORAGE_KEY = "snackoverflow_mock_store_v1";

export interface MockStoreData {
  snacks: Snack[];
  productRequests: SnackProductRequest[];
  activities: Activity[];
  // Map of userId -> array of snackIds they voted for
  userVotes: Record<string, string[]>;
}

function getInitialStore(): MockStoreData {
  // Seed initial votes to match snack voteCounts
  const initialVotes: Record<string, string[]> = {
    usr_member_1: ["snack_1", "snack_2", "snack_3", "snack_7", "snack_9"],
    usr_member_2: ["snack_1", "snack_2", "snack_4", "snack_14"],
    usr_member_3: ["snack_1", "snack_3", "snack_6", "snack_7"],
    usr_member_4: ["snack_1", "snack_2", "snack_4"],
    usr_member_5: ["snack_2", "snack_3", "snack_9"],
  };

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.snacks && parsed.productRequests) {
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed data
    }
  }

  return {
    snacks: [...SEED_SNACKS],
    productRequests: [...SEED_REQUESTS],
    activities: [...SEED_ACTIVITIES],
    userVotes: initialVotes,
  };
}

let store: MockStoreData = getInitialStore();

function persistStore() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("Failed to persist mock store to localStorage", e);
    }
  }
}

export { getStockStatus } from "@/lib/domain/stock";

/**
 * Normalize product names for deduplication
 */
export function normalizeProductKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export const mockStore = {
  get: (): MockStoreData => store,

  updateSnacks: (updater: (snacks: Snack[]) => Snack[]) => {
    store.snacks = updater(store.snacks);
    persistStore();
    return store.snacks;
  },

  deleteSnack: (snackId: string): void => {
    store.snacks = store.snacks.filter((snack) => snack.id !== snackId);
    for (const [userId, snackIds] of Object.entries(store.userVotes)) {
      store.userVotes[userId] = snackIds.filter((id) => id !== snackId);
    }
    persistStore();
  },

  updateRequests: (updater: (requests: SnackProductRequest[]) => SnackProductRequest[]) => {
    store.productRequests = updater(store.productRequests);
    persistStore();
    return store.productRequests;
  },

  addActivity: (activity: Omit<Activity, "id">) => {
    const newActivity: Activity = {
      ...activity,
      id: "act_" + Math.random().toString(36).substring(2, 9),
    };
    store.activities = [newActivity, ...store.activities];
    persistStore();
    return newActivity;
  },

  toggleUserVote: (userId: string, snackId: string): { voted: boolean; newCount: number } => {
    const currentList = store.userVotes[userId] || [];
    const hasVoted = currentList.includes(snackId);

    const targetSnack = store.snacks.find((s) => s.id === snackId);
    if (!targetSnack) throw new Error("Snack not found");

    if (hasVoted) {
      store.userVotes[userId] = currentList.filter((id) => id !== snackId);
      targetSnack.voteCount = Math.max(0, targetSnack.voteCount - 1);
    } else {
      store.userVotes[userId] = [...currentList, snackId];
      targetSnack.voteCount = targetSnack.voteCount + 1;
    }

    persistStore();
    return {
      voted: !hasVoted,
      newCount: targetSnack.voteCount,
    };
  },

  hasUserVoted: (userId: string, snackId: string): boolean => {
    return (store.userVotes[userId] || []).includes(snackId);
  },

  resetToDefaults: () => {
    store = {
      snacks: [...SEED_SNACKS],
      productRequests: [...SEED_REQUESTS],
      activities: [...SEED_ACTIVITIES],
      userVotes: {
        usr_member_1: ["snack_1", "snack_2", "snack_3", "snack_7", "snack_9"],
        usr_member_2: ["snack_1", "snack_2", "snack_4", "snack_14"],
      },
    };
    persistStore();
    return store;
  },
};
