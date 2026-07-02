import "server-only";

import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_DATA_DIR = path.join(process.cwd(), "data");

function resolveRuntimeDataDir() {
  const configuredDir = String(process.env.ORIN_RUNTIME_DATA_DIR || "").trim();
  if (configuredDir) {
    return path.resolve(configuredDir);
  }

  return path.join(os.tmpdir(), "orin-blog-runtime");
}

const RUNTIME_DATA_DIR = resolveRuntimeDataDir();

function cloneDefaultValue(value) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "object") {
    return JSON.parse(JSON.stringify(value));
  }

  return value;
}

function parseJson(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function readJsonSync(filePath) {
  try {
    const rawValue = fs.readFileSync(filePath, "utf8");
    return parseJson(rawValue);
  } catch {
    return null;
  }
}

async function readJson(filePath) {
  try {
    const rawValue = await fsPromises.readFile(filePath, "utf8");
    return parseJson(rawValue);
  } catch {
    return null;
  }
}

export function getRuntimeDataDir() {
  return RUNTIME_DATA_DIR;
}

export function getRuntimeDataFile(fileName) {
  return path.join(RUNTIME_DATA_DIR, fileName);
}

export function getRepoSeedDataFile(fileName) {
  return path.join(REPO_DATA_DIR, fileName);
}

export function readSeededRuntimeJsonSync(fileName, fallbackValue) {
  const runtimeValue = readJsonSync(getRuntimeDataFile(fileName));
  if (runtimeValue !== null) {
    return runtimeValue;
  }

  const seedValue = readJsonSync(getRepoSeedDataFile(fileName));
  if (seedValue !== null) {
    return seedValue;
  }

  return cloneDefaultValue(fallbackValue);
}

export async function readSeededRuntimeJson(fileName, fallbackValue) {
  const runtimeValue = await readJson(getRuntimeDataFile(fileName));
  if (runtimeValue !== null) {
    return runtimeValue;
  }

  const seedValue = await readJson(getRepoSeedDataFile(fileName));
  if (seedValue !== null) {
    return seedValue;
  }

  return cloneDefaultValue(fallbackValue);
}

export async function writeRuntimeJson(fileName, value, options = {}) {
  const { trailingNewline = false } = options;
  const filePath = getRuntimeDataFile(fileName);
  const fileContents = JSON.stringify(value, null, 2);
  const serialized = trailingNewline ? `${fileContents}\n` : fileContents;

  await fsPromises.mkdir(RUNTIME_DATA_DIR, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  await fsPromises.writeFile(tmpPath, serialized, "utf8");
  await fsPromises.rename(tmpPath, filePath);

  return filePath;
}
