import { User } from "@/types";
import { SEED_USERS } from "../data/users";
import { simulateLatency } from "../latency";

export const demoAuthService = {
  async getUsers(): Promise<User[]> {
    await simulateLatency(50, 100);
    return [...SEED_USERS];
  },

  async getUserById(id: string): Promise<User | null> {
    await simulateLatency(50, 100);
    return SEED_USERS.find((u) => u.id === id) || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    await simulateLatency(50, 100);
    return (
      SEED_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      ) || null
    );
  },
};

