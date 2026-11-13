import { mockStore } from "../store";
import { simulateLatency } from "../latency";

export const voteService = {
  async getUserVotes(userId: string): Promise<string[]> {
    await simulateLatency(50, 120);
    const { userVotes } = mockStore.get();
    return userVotes[userId] || [];
  },

  async hasUserVoted(userId: string, snackId: string): Promise<boolean> {
    const { userVotes } = mockStore.get();
    return (userVotes[userId] || []).includes(snackId);
  },

  /**
   * Toggles vote for a snack enforcing one vote per user per snack.
   */
  async toggleVote(
    snackId: string,
    userId: string
  ): Promise<{ voted: boolean; newCount: number }> {
    await simulateLatency(100, 200);
    return mockStore.toggleUserVote(userId, snackId);
  },
};

