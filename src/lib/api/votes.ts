import { requestJson } from "@/lib/api/client";
import {
  toggleVoteResponseSchema,
  userVotesResponseSchema,
} from "@/lib/api/vote-contracts";

export async function fetchUserVotes(): Promise<string[]> {
  const response = await requestJson("/api/votes");
  return userVotesResponseSchema.parse(response).snackIds;
}

export async function toggleVote(snackId: string) {
  const response = await requestJson(
    `/api/snacks/${encodeURIComponent(snackId)}/vote`,
    { method: "POST" }
  );
  return toggleVoteResponseSchema.parse(response);
}
