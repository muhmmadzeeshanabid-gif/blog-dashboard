import { NextResponse } from "next/server";
import { recordVisit } from "@/backend/lib/siteAnalytics";

export async function POST(request) {
  try {
    const { pathname, isNewVisitor } = await request.json();
    
    if (!pathname) {
      return NextResponse.json({ error: "pathname is required" }, { status: 400 });
    }

    const updatedStats = await recordVisit(pathname, !!isNewVisitor);

    return NextResponse.json({ success: true, stats: updatedStats });
  } catch (err) {
    console.error("[Track API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
