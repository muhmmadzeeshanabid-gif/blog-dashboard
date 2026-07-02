import { NextResponse } from "next/server";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const SUBSCRIBERS_FILE_NAME = "subscribers.json";

export async function POST(req) {
  try {
    const { email } = await req.json();

    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const subscribedAt = new Date().toISOString();
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Save to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("subscribers")
          .upsert(
            { id, email: normalizedEmail, subscribed_at: subscribedAt },
            { onConflict: "email" }
          );

        if (error) {
          console.error("[Subscribe] Supabase error:", error.message);
        }
      } catch (err) {
        console.error("[Subscribe] Supabase failed:", err);
      }
    }

    // 2. Save to local runtime store as fallback
    try {
      const storedSubscribers = await readSeededRuntimeJson(SUBSCRIBERS_FILE_NAME, []);
      const subscribers = Array.isArray(storedSubscribers) ? storedSubscribers : [];

      // Prevent duplicate emails
      const alreadyExists = subscribers.some(
        (s) => String(s.email).toLowerCase() === normalizedEmail
      );

      if (!alreadyExists) {
        subscribers.push({ id, email: normalizedEmail, subscribedAt });
        await writeRuntimeJson(SUBSCRIBERS_FILE_NAME, subscribers);
      }
    } catch (err) {
      console.warn("[Subscribe] Local file write failed:", err.message);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! You have successfully subscribed to our newsletter.",
    });
  } catch (err) {
    console.error("[Subscribe API] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
