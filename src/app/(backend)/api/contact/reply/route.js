import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";

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

export async function POST(req) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const { messageId, replyText } = await req.json();

    if (!messageId || !replyText?.trim()) {
      return NextResponse.json(
        { error: "Message ID and reply text are required." },
        { status: 400 }
      );
    }

    let contacts = [];
    try {
      const raw = await fs.readFile(CONTACTS_FILE, "utf-8");
      contacts = JSON.parse(raw);
    } catch (e) {
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
      repliedBy: currentUser.name || currentUser.email
    };

    contacts[msgIndex].replies.push(newReply);

    await fs.mkdir(path.dirname(CONTACTS_FILE), { recursive: true });
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Reply saved successfully.",
      data: newReply
    });
  } catch (err) {
    console.error("[Reply API] Failed to save reply:", err);
    return NextResponse.json(
      { error: "Server failed to record reply." },
      { status: 500 }
    );
  }
}
