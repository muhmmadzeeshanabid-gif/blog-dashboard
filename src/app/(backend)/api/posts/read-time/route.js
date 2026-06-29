import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const READ_TIME_FILE = path.join(process.cwd(), "data", "read-time.json");

function pad(num) {
  return String(num).padStart(2, "0");
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function POST(request) {
  try {
    const { slug, seconds, isNewSession } = await request.json();

    if (!slug || typeof seconds !== "number" || seconds <= 0) {
      return NextResponse.json(
        { error: "Invalid parameters. 'slug' (string) and 'seconds' (positive number) are required." },
        { status: 400 }
      );
    }

    const todayKey = getDateKey(new Date());

    let data = {};
    try {
      const raw = await fs.readFile(READ_TIME_FILE, "utf-8");
      data = JSON.parse(raw);
    } catch (e) {
      // File doesn't exist yet, start with empty object
    }

    if (!data[slug]) {
      data[slug] = {};
    }
    if (!data[slug][todayKey]) {
      data[slug][todayKey] = { seconds: 0, sessions: 0 };
    }

    data[slug][todayKey].seconds += seconds;
    if (isNewSession) {
      data[slug][todayKey].sessions += 1;
    }

    // Write back to file
    await fs.mkdir(path.dirname(READ_TIME_FILE), { recursive: true });
    await fs.writeFile(READ_TIME_FILE, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      data: data[slug][todayKey]
    });
  } catch (err) {
    console.error("[ReadTime API] Error:", err);
    return NextResponse.json(
      { error: "Server failed to process read time log." },
      { status: 500 }
    );
  }
}
