/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * How it works:
 * - Each key (e.g. IP address) gets a sliding window of attempts.
 * - If attempts exceed the limit within the window, the request is blocked.
 * - Old entries are pruned on each check to avoid memory leaks.
 *
 * NOTE: This is process-local. In a multi-instance deployment (e.g. multiple
 * Vercel serverless functions), each instance has its own counter. This is
 * still an effective deterrent against simple brute-force attacks since
 * requests from the same IP typically route to the same instance.
 * For distributed rate limiting, use Upstash Redis.
 */

const store = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const MAX_ATTEMPTS = 10;           // max login attempts per window per IP

/**
 * Prune entries older than the window to prevent memory growth.
 */
function pruneExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      store.delete(key);
    }
  }
}

/**
 * Check and record a login attempt for a given key (IP address).
 *
 * @param {string} key - The identifier to rate limit (e.g. IP address).
 * @returns {{ allowed: boolean, attemptsRemaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(key) {
  pruneExpired();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // Start a fresh window
    store.set(key, { windowStart: now, attempts: 1 });
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  entry.attempts += 1;

  if (entry.attempts > MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, attemptsRemaining: 0, retryAfterMs };
  }

  return {
    allowed: true,
    attemptsRemaining: MAX_ATTEMPTS - entry.attempts,
    retryAfterMs: 0,
  };
}
