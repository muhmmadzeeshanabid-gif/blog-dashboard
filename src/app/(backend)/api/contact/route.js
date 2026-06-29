import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { createActionNotification, appendSharedActionNotification } from "@/dashboard/lib/dashboardNotifications";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const CONTACTS_FILE = path.join(process.cwd(), "data", "contacts.json");

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("orin_user_session")?.value;

  if (!sessionValue) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(sessionValue));
  } catch {
    return null;
  }
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    if (isSupabaseConfiyrgured) {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Map Supabase snake_case fields back to camelCase
      const mapped = (data || []).map(msg => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        submittedAt: msg.submitted_at,
        captchaQuestion: msg.captcha_question,
        captchaAnswer: msg.captcha_answer
      }));

      return NextResponse.json({ success: true, data: mapped });
    } else {
      let contacts = [];
      try {
        const raw = await fs.readFile(CONTACTS_FILE, "utf-8");
        contacts = JSON.parse(raw);
        if (!Array.isArray(contacts)) {
          contacts = [];
        }
      } catch (e) {
        // File doesn't exist yet
      }

      // Sort contacts by submittedAt descending (newest first)
      contacts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      return NextResponse.json({ success: true, data: contacts });
    }
  } catch (err) {
    console.error("[Contact API] GET failed:", err);
    return NextResponse.json(
      { error: "Server failed to retrieve messages." },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: "Message deleted successfully."
      });
    } else {
      let contacts = [];
      try {
        const raw = await fs.readFile(CONTACTS_FILE, "utf-8");
        contacts = JSON.parse(raw);
        if (!Array.isArray(contacts)) {
          contacts = [];
        }
      } catch (e) {
        return NextResponse.json({ error: "No messages found." }, { status: 404 });
      }

      const initialLength = contacts.length;
      contacts = contacts.filter((msg) => msg.id !== id);

      if (contacts.length === initialLength) {
        return NextResponse.json({ error: "Message not found." }, { status: 404 });
      }

      await fs.mkdir(path.dirname(CONTACTS_FILE), { recursive: true });
      await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: "Message deleted successfully."
      });
    }
  } catch (err) {
    console.error("[Contact API] DELETE failed:", err);
    return NextResponse.json(
      { error: "Server failed to delete message." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { name, email, subject, message, captchaQuestion, captchaAnswer } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All contact form fields are required." },
        { status: 400 }
      );
    }

    const submissionId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const submittedAt = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("contacts")
        .insert({
          id: submissionId,
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          submitted_at: submittedAt,
          captcha_question: captchaQuestion || null,
          captcha_answer: captchaAnswer || null
        });

      if (error) {
        throw error;
      }
    } else {
      // Load existing contact submissions
      let contacts = [];
      try {
        const raw = await fs.readFile(CONTACTS_FILE, "utf-8");
        contacts = JSON.parse(raw);
        if (!Array.isArray(contacts)) {
          contacts = [];
        }
      } catch (e) {
        // File doesn't exist yet, start with empty array
      }

      const newSubmission = {
        id: submissionId,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: submittedAt,
        captchaQuestion: captchaQuestion || null,
        captchaAnswer: captchaAnswer || null
      };

      contacts.push(newSubmission);

      // Write back to file
      await fs.mkdir(path.dirname(CONTACTS_FILE), { recursive: true });
      await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
    }

    // Add a dashboard notification for the admin
    try {
      const notification = createActionNotification({
        type: "contact-message",
        title: `New message from ${name.trim()} (${email.trim()})`,
        recipientRole: "admin",
        actorName: name.trim(),
        targetName: subject.trim()
      });
      await appendSharedActionNotification(notification);
    } catch (err) {
      console.error("[Contact API] Failed to append notification:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Message recorded successfully",
      data: {
        id: submissionId,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: submittedAt
      }
    });
  } catch (err) {
    console.error("[Contact API] Submission failed:", err);
    return NextResponse.json(
      { error: "Server failed to process submission." },
      { status: 500 }
    );
  }
}

