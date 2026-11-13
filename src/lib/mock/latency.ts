/**
 * Simulates network latency for realistic mock API calls.
 */
export async function simulateLatency(minMs = 120, maxMs = 280): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

