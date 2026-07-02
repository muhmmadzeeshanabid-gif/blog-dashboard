import "server-only";

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Stateless HMAC-signed session tokens
//
// WHY: Vercel serverless functions each get their own isolated /tmp directory.
// File-based session storage (sessions.json in /tmp) is NOT shared between
// lambda instances, so every request that hits a different cold lambda loses
// the session → 401 loop.
//
// FIX: Encode the session data directly inside the cookie as a signed token.
// The server verifies the HMAC signature — no file read/write needed.
// Sessions work identically across all Vercel lambda instances.
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE_NAME = "orin_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Returns the HMAC signing secret.
 * Set SESSION_SECRET in your environment variables (Vercel dashboard → Settings → Environment Variables).
 * Falls back to a deterministic-but-weak key if not set (development only).
 */
function getSecret() {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    // In production this is insecure — add SESSION_SECRET to your env vars!
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[SessionStore] ⚠️  SESSION_SECRET env var is NOT set in production! " +
        "All sessions will be signed with a weak fallback key. " +
        "Add SESSION_SECRET to Vercel → Settings → Environment Variables."
      );
    }
    return "orin-insecure-dev-fallback-key-set-SESSION_SECRET-in-env";
  }
  return secret;
}

/**
 * HMAC-sign a string payload.
 */
function sign(payload) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Encode session data into a signed token string.
 * Format: base64url(JSON) + "." + hmac_signature
 */
function encodeToken(userId, expiresAt) {
  const jti = randomBytes(8).toString("hex"); // unique token ID (prevents token reuse concerns)
  const payload = Buffer.from(
    JSON.stringify({
      uid: String(userId),
      exp: expiresAt,
      iat: new Date().toISOString(),
      jti,
    })
  ).toString("base64url");

  const sig = sign(payload);
  return `${payload}.${sig}`;
}

/**
 * Decode and verify a signed token.
 * Returns the payload object or null if invalid/expired.
 */
function decodeToken(token) {
  if (!token || typeof token !== "string") return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  // Verify signature first (timing-safe)
  try {
    const expectedSig = sign(payload);
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");

    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null; // Tampered token
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — same interface as the old file-based sessionStore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new session for a user.
 * Returns { token, expiresAt } — no file I/O.
 */
export async function createSession(userId) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const token = encodeToken(userId, expiresAt);
  return { token, expiresAt };
}

/**
 * Validate and decode a session token.
 * Returns a session-like object or null if invalid/expired.
 */
export async function getSession(token) {
  const data = decodeToken(token);
  if (!data) return null;

  const { uid, exp, iat } = data;
  if (!uid || !exp) return null;

  // Check expiry
  const expiry = new Date(exp).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;

  // Return an object with the same shape as the old file-based session
  return {
    tokenHash: token,
    userId: String(uid),
    createdAt: iat || new Date().toISOString(),
    expiresAt: exp,
  };
}

/**
 * Delete (invalidate) a session.
 *
 * With stateless tokens, server-side invalidation is not possible without
 * external storage. Logout is handled by clearing the cookie in auth.js
 * (endUserSession sets the cookie to empty + maxAge=0), so the token
 * becomes unreachable from the browser even though it is technically still
 * valid until expiry.
 *
 * For the vast majority of use cases (logout, session expiry) this is fine.
 * If you need instant server-side revocation, store revoked JTIs in Supabase.
 */
export async function deleteSession(_token) {
  // No-op for stateless tokens — logout handled by cookie deletion.
}

/**
 * Clear all sessions for a user.
 *
 * No-op for stateless tokens. New login always issues a fresh token.
 * Old tokens expire naturally after SESSION_TTL_MS.
 */
export async function clearUserSessions(_userId) {
  // No-op for stateless tokens.
}
