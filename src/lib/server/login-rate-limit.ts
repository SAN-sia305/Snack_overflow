interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

export class LoginRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxAttempts = 10,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly maxEntries = 10_000
  ) {}

  isLimited(keys: string[], now = Date.now()): boolean {
    this.removeExpired(now);
    return keys.some((key) => (this.entries.get(key)?.attempts ?? 0) >= this.maxAttempts);
  }

  recordFailure(keys: string[], now = Date.now()): void {
    this.removeExpired(now);

    for (const key of keys) {
      const current = this.entries.get(key);
      if (!current || current.resetAt <= now) {
        this.ensureCapacity();
        this.entries.set(key, { attempts: 1, resetAt: now + this.windowMs });
      } else {
        current.attempts += 1;
      }
    }
  }

  clear(keys: string[]): void {
    for (const key of keys) {
      this.entries.delete(key);
    }
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private ensureCapacity(): void {
    if (this.entries.size < this.maxEntries) {
      return;
    }

    const oldestKey = this.entries.keys().next().value;
    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }
}

export const loginRateLimiter = new LoginRateLimiter();

export function getLoginRateLimitKeys(request: Request, email: string): string[] {
  const forwardedAddress = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    .trim();
  const address =
    request.headers.get("x-real-ip")?.trim() || forwardedAddress || "unknown";

  return [`email:${email}`, `address:${address}`];
}
