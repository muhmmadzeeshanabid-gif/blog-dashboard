import { needsPasswordRehash, hashPassword } from "@/backend/lib/passwords";
import { readSeededRuntimeJson, writeRuntimeJson } from "@/backend/lib/runtimeState";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const USERS_FILE_NAME = "users.json";

// In-memory cache for user list to speed up dashboard page loads
let cachedUsers = null;
let cachedUsersTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

export async function getAllUsers() {
  const now = Date.now();
  if (cachedUsers && (now - cachedUsersTime < CACHE_TTL_MS)) {
    return cachedUsers;
  }

  const localUsersState = await readSeededRuntimeJson(USERS_FILE_NAME, []);
  const localUsers = Array.isArray(localUsersState) ? localUsersState : [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("blog_users")
        .select("*")
        .order("joined_at", { ascending: false });

      if (!error && data) {
        if (data.length === 0 && localUsers.length > 0) {
          console.log("[UserStore] Supabase blog_users table is empty. Seeding from local file...");
          const seedPayloads = localUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar: user.avatar || "",
            bio: user.bio || "",
            password: user.password || "",
            expires_at: user.expiresAt || null,
            joined_at: user.joinedAt || new Date().toISOString(),
          }));
          const { error: seedError } = await supabase
            .from("blog_users")
            .insert(seedPayloads);

          if (seedError) {
            console.error("[UserStore] Seeding Supabase failed:", seedError.message);
          } else {
            console.log("[UserStore] Seeding Supabase complete!");
          }
          cachedUsers = localUsers;
          cachedUsersTime = Date.now();
          return localUsers;
        }

        const mappedUsers = data.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar || "",
          bio: user.bio || "",
          password: user.password || "",
          expiresAt: user.expires_at || null,
          joinedAt: user.joined_at,
        }));

        cachedUsers = mappedUsers;
        cachedUsersTime = Date.now();
        return mappedUsers;
      }
      console.warn("[UserStore] Supabase select failed, fallback to local users store:", error?.message || error);
    } catch (err) {
      console.warn("[UserStore] Supabase query error, fallback to local users store:", err);
    }
  }

  cachedUsers = localUsers;
  cachedUsersTime = Date.now();
  return localUsers;
}

export async function saveUser(userData) {
  cachedUsers = null; // Invalidate cache
  const preparedUser = { ...userData };

  if (needsPasswordRehash(preparedUser.password)) {
    preparedUser.password = await hashPassword(preparedUser.password);
  }

  if (isSupabaseConfigured) {
    try {
      const dbPayload = {
        id: preparedUser.id,
        name: preparedUser.name,
        email: preparedUser.email,
        role: preparedUser.role,
        status: preparedUser.status,
        avatar: preparedUser.avatar || "",
        bio: preparedUser.bio || "",
        password: preparedUser.password || "",
        expires_at: preparedUser.expiresAt || null,
        joined_at: preparedUser.joinedAt || new Date().toISOString(),
      };

      const { error } = await supabase
        .from("blog_users")
        .upsert(dbPayload, { onConflict: "id" });

      if (error) {
        console.error("[UserStore] Supabase upsert error:", error.message);
      }
    } catch (err) {
      console.error("[UserStore] Supabase upsert failed:", err);
    }
  }

  try {
    const stateUsers = await readSeededRuntimeJson(USERS_FILE_NAME, []);
    const users = Array.isArray(stateUsers) ? stateUsers : [];

    const existingIndex = users.findIndex((user) => user.id === preparedUser.id);
    if (existingIndex > -1) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...preparedUser,
      };
    } else {
      users.push(preparedUser);
    }

    await writeRuntimeJson(USERS_FILE_NAME, users);
  } catch (err) {
    console.warn("[UserStore] Local file write failed (expected on live):", err.message);
  }
}

export async function deleteUser(id) {
  cachedUsers = null; // Invalidate cache
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("blog_users")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[UserStore] Supabase delete error:", error.message);
      }
    } catch (err) {
      console.error("[UserStore] Supabase delete failed:", err);
    }
  }

  try {
    const stateUsers = await readSeededRuntimeJson(USERS_FILE_NAME, []);
    let users = Array.isArray(stateUsers) ? stateUsers : [];

    users = users.filter((user) => user.id !== id);

    await writeRuntimeJson(USERS_FILE_NAME, users);
  } catch (err) {
    console.warn("[UserStore] Local file delete write failed (expected on live):", err.message);
  }
}
