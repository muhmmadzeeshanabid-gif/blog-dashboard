import { cookies, headers } from "next/headers";
import { startUserSession } from "@/backend/lib/auth";
import { needsPasswordRehash, verifyPassword } from "@/backend/lib/passwords";
import { getAllUsers, saveUser } from "@/backend/lib/userStore";
import { checkRateLimit } from "@/backend/lib/rateLimiter";

export async function POST(request) {
  try {
    // TASK 2: Rate limiting — max 10 attempts per IP per 15 minutes.
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const { allowed, attemptsRemaining, retryAfterMs } = checkRateLimit(`login:${ip}`);

    if (!allowed) {
      const retryAfterSecs = Math.ceil(retryAfterMs / 1000);
      return Response.json(
        { error: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSecs / 60)} minute(s).` },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSecs) },
        }
      );
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const users = await getAllUsers();
    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!matchedUser) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (matchedUser.status === "inactive") {
      return Response.json({ error: "Your account has been deactivated. Please contact the administrator." }, { status: 403 });
    }

    if (matchedUser.expiresAt) {
      const expiry = new Date(matchedUser.expiresAt);
      if (expiry < new Date()) {
        return Response.json({ error: "Admin revoked your access." }, { status: 403 });
      }
    }

    const enteredPassword = String(password).trim();
    const isPasswordValid = await verifyPassword(enteredPassword, matchedUser.password);

    if (!isPasswordValid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (needsPasswordRehash(matchedUser.password)) {
      await saveUser({
        ...matchedUser,
        password: enteredPassword,
      });
    }

    const cookieStore = await cookies();
    const user = await startUserSession(cookieStore, matchedUser);

    return Response.json({ success: true, user });
  } catch (err) {
    console.error("[Login API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}