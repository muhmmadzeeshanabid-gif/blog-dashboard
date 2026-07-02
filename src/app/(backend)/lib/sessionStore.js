import { randomBytes, createHash } from "node:crypto";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";

export const SESSION_COOKIE_NAME = "orin_session";

const SESSIONS_FILE_NAME = "sessions.json";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(String(token ?? "")).digest("hex");
}

function isFutureDate(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function normalizeSession(value) {
  return {
    tokenHash: String(value?.tokenHash ?? ""),
    userId: String(value?.userId ?? ""),
    createdAt: String(value?.createdAt ?? ""),
    expiresAt: String(value?.expiresAt ?? ""),
  };
}

async function readSessions() {
  const parsed = await readSeededRuntimeJson(SESSIONS_FILE_NAME, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(normalizeSession)
    .filter((session) => session.tokenHash && session.userId && isFutureDate(session.expiresAt));
}

async function writeSessions(sessions) {
  await writeRuntimeJson(SESSIONS_FILE_NAME, sessions);
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  const sessions = await readSessions();

  sessions.push({
    tokenHash: hashToken(token),
    userId: String(userId),
    createdAt: now.toISOString(),
    expiresAt,
  });

  await writeSessions(sessions);

  return {
    token,
    expiresAt,
  };
}

export async function getSession(token) {
  if (!token) {
    return null;
  }

  const sessions = await readSessions();
  const tokenHash = hashToken(token);
  const session = sessions.find((entry) => entry.tokenHash === tokenHash) ?? null;

  if (sessions.length > 0 && sessions.length !== sessions.filter((entry) => isFutureDate(entry.expiresAt)).length) {
    await writeSessions(sessions.filter((entry) => isFutureDate(entry.expiresAt)));
  }

  return session;
}

export async function deleteSession(token) {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  const sessions = await readSessions();
  const nextSessions = sessions.filter((entry) => entry.tokenHash !== tokenHash);

  if (nextSessions.length !== sessions.length) {
    await writeSessions(nextSessions);
  }
}

export async function clearUserSessions(userId) {
  if (!userId) {
    return;
  }

  const sessions = await readSessions();
  const nextSessions = sessions.filter((entry) => entry.userId !== String(userId));

  if (nextSessions.length !== sessions.length) {
    await writeSessions(nextSessions);
  }
}
