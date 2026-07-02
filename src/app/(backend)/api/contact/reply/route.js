import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUserFromStore } from "@/backend/lib/auth";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";

const CONTACTS_FILE_NAME = "contacts.json";

function isAdminUser(user) {
  return String(user?.role ?? "").trim().toLowerCase() === "admin";
}

export async function POST(req) {
  const cookieStore = await cookies();
  const currentUser = await getAuthenticatedUserFromStore(cookieStore);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isAdminUser(currentUser)) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const { messageId, replyText } = await req.json();

    if (!messageId || !replyText?.trim()) {
      return NextResponse.json({ error: "Message ID and reply text are required." }, { status: 400 });
    }

    const storedContacts = await readSeededRuntimeJson(CONTACTS_FILE_NAME, []);
    const contacts = Array.isArray(storedContacts) ? storedContacts : [];

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No messages found." }, { status: 404 });
    }

    const msgIndex = contacts.findIndex((msg) => msg.id === messageId);
    if (msgIndex === -1) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    if (!contacts[msgIndex].replies) {
      contacts[msgIndex].replies = [];
    }

    const newReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: replyText.trim(),
      repliedAt: new Date().toISOString(),
      repliedBy: currentUser.name || currentUser.email,
    };

    contacts[msgIndex].replies.push(newReply);

    await writeRuntimeJson(CONTACTS_FILE_NAME, contacts);

    return NextResponse.json({ success: true, message: "Reply saved successfully.", data: newReply });
  } catch (err) {
    console.error("[Reply API] Failed to save reply:", err);
    return NextResponse.json({ error: "Server failed to record reply." }, { status: 500 });
  }
}
