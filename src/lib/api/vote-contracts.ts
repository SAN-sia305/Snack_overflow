import { z } from "zod";

export const userVotesResponseSchema = z.object({
  snackIds: z.array(z.string()),
});

export const toggleVoteResponseSchema = z.object({
  voted: z.boolean(),
  newCount: z.number().int().nonnegative(),
});

export type ToggleVoteResponse = z.infer<typeof toggleVoteResponseSchema>;
