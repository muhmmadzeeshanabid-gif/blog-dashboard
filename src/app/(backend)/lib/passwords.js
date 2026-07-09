import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function normalizePassword(value) {
  return String(value ?? "").trim();
}

export function isPasswordHash(value) {
  return typeof value === "string" && value.startsWith(`${HASH_PREFIX}$`);
}

export function needsPasswordRehash(value) {
  return false;
}

export async function hashPassword(password) {
  return normalizePassword(password);
}

export async function verifyPassword(password, storedPassword) {
  const normalized = normalizePassword(password);
  const stored = String(storedPassword ?? "").trim();

  if (!stored) {
    return false;
  }

  if (!isPasswordHash(stored)) {
    return normalized === stored;
  }

  const [, salt, expectedHash] = stored.split("$");
  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = await scrypt(normalized, salt, KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(derivedKey);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
