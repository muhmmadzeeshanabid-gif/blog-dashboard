import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { createActionNotification, appendSharedActionNotification } from "@/dashboard/lib/dashboardNotifications";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const CONTACTS_FILE_NAME = "contacts.json";

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

async function requireAdminUser() {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);

  if (!currentUser) {
    return {
      currentUser: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminUser(currentUser)) {
    return {
      currentUser,
      response: NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 }),
    };
  }

  return { currentUser, response: null };
}

async function readLocalContacts() {
  const storedContacts = await readSeededRuntimeJson(CONTACTS_FILE_NAME, []);
  return Array.isArray(storedContacts) ? storedContacts : [];
}

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) {
    return response;
  }

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data || []).map((msg) => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        submittedAt: msg.submitted_at,
        captchaQuestion: msg.captcha_question,
        captchaAnswer: msg.captcha_answer,
      }));

      return NextResponse.json({ success: true, data: mapped });
    }

    const contacts = await readLocalContacts();
    contacts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return NextResponse.json({ success: true, data: contacts });
  } catch (err) {
    console.error("[Contact API] GET failed:", err);
    return NextResponse.json({ error: "Server failed to retrieve messages." }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { response } = await requireAdminUser();
  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, message: "Message deleted successfully." });
    }

    let contacts = await readLocalContacts();
    if (contacts.length === 0) {
      return NextResponse.json({ error: "No messages found." }, { status: 404 });
    }

    const initialLength = contacts.length;
    contacts = contacts.filter((msg) => msg.id !== id);

    if (contacts.length === initialLength) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    await writeRuntimeJson(CONTACTS_FILE_NAME, contacts);

    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    console.error("[Contact API] DELETE failed:", err);
    return NextResponse.json({ error: "Server failed to delete message." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, subject, message, captchaQuestion, captchaAnswer } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All contact form fields are required." }, { status: 400 });
    }

    // Bug #6 fix: Validate that email is a proper email address format,
    // not just a non-empty string. Previously "abc" or "test@" were accepted.
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
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
          captcha_answer: captchaAnswer || null,
        });

      if (error) {
        throw error;
      }
    } else {
      const contacts = await readLocalContacts();

      const newSubmission = {
        id: submissionId,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt,
        captchaQuestion: captchaQuestion || null,
        captchaAnswer: captchaAnswer || null,
      };

      contacts.push(newSubmission);

      await writeRuntimeJson(CONTACTS_FILE_NAME, contacts);
    }

    try {
      const notification = createActionNotification({
        id: submissionId,
        type: "contact-message",
        title: `New message from ${name.trim()} (${email.trim()})`,
        recipientRole: "admin",
        actorName: name.trim(),
        targetName: subject.trim(),
        messageText: message.trim(),
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
        submittedAt,
      },
    });
  } catch (err) {
    console.error("[Contact API] Submission failed:", err);
    return NextResponse.json({ error: "Server failed to process submission." }, { status: 500 });
  }
}
