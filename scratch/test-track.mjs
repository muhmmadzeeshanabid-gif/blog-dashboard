import { getSiteAnalytics, recordVisit } from "../src/lib/siteAnalytics.js";
import fs from "node:fs/promises";
import path from "node:path";

async function test() {
  console.log("Seeding analytics...");
  const initialAnalytics = await getSiteAnalytics();
  console.log("Initial Analytics Keys:", Object.keys(initialAnalytics));

  console.log("\nRecording visit to '/'...");
  const updatedStats = await recordVisit("/", true);
  console.log("Updated Stats for today:", updatedStats);

  const fileContent = await fs.readFile(
    path.join(process.cwd(), "data", "site-analytics.json"),
    "utf-8"
  );
  console.log("\nSaved file content sample (first 500 chars):");
  console.log(fileContent.substring(0, 500));
}

test().catch(console.error);
