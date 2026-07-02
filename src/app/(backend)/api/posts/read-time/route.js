import { NextResponse } from "next/server";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";

const READ_TIME_FILE_NAME = "read-time.json";

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
    const storedData = await readSeededRuntimeJson(READ_TIME_FILE_NAME, {});
    const data = storedData && typeof storedData === "object" && !Array.isArray(storedData)
      ? storedData
      : {};

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

    await writeRuntimeJson(READ_TIME_FILE_NAME, data);

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
