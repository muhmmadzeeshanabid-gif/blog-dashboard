import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONTACTS_FILE = path.join(process.cwd(), "data", "contacts.json");

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All contact form fields are required." },
        { status: 400 }
      );
    }

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
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString()
    };

    contacts.push(newSubmission);

    // Write back to file
    await fs.mkdir(path.dirname(CONTACTS_FILE), { recursive: true });
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Message recorded successfully",
      data: newSubmission
    });
  } catch (err) {
    console.error("[Contact API] Submission failed:", err);
    return NextResponse.json(
      { error: "Server failed to process submission." },
      { status: 500 }
    );
  }
}
