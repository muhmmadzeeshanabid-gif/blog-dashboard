import { promises as fs } from "node:fs";
import path from "node:path";
import { supabaseAdmin as supabase, isSupabaseConfigured } from "@/backend/lib/supabase";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

export async function getAllUsers() {
  let localUsers = [];
  try {
    const fileData = await fs.readFile(usersFilePath, "utf8");
    if (fileData.trim()) {
      localUsers = JSON.parse(fileData);
    }
  } catch (err) {
    // ignore missing file
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("blog_users")
        .select("*")
        .order("joined_at", { ascending: false });

      if (!error && data) {
        // If Supabase table is empty but we have local users, seed Supabase!
        if (data.length === 0 && localUsers.length > 0) {
          console.log("[UserStore] Supabase blog_users table is empty. Seeding from local file...");
          const seedPayloads = localUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            avatar: u.avatar || "",
            bio: u.bio || "",
            password: u.password || "",
            expires_at: u.expiresAt || null,
            joined_at: u.joinedAt || new Date().toISOString()
          }));
          const { error: seedError } = await supabase
            .from("blog_users")
            .insert(seedPayloads);

          if (seedError) {
            console.error("[UserStore] Seeding Supabase failed:", seedError.message);
          } else {
            console.log("[UserStore] Seeding Supabase complete!");
          }
          return localUsers;
        }

        // Map Supabase snake_case fields back to camelCase
        return data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          avatar: u.avatar || "",
          bio: u.bio || "",
          password: u.password || "",
          expiresAt: u.expires_at || null,
          joinedAt: u.joined_at
        }));
      }
      console.warn("[UserStore] Supabase select failed, fallback to local users.json:", error?.message || error);
    } catch (err) {
      console.warn("[UserStore] Supabase query error, fallback to local users.json:", err);
    }
  }

  return localUsers;
}

export async function saveUser(userData) {
  // 1. Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const dbPayload = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        avatar: userData.avatar || "",
        bio: userData.bio || "",
        password: userData.password || "",
        expires_at: userData.expiresAt || null,
        joined_at: userData.joinedAt || new Date().toISOString()
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

  // 2. Write to local file for fallback/compat
  try {
    let users = [];
    try {
      const fileData = await fs.readFile(usersFilePath, "utf8");
      if (fileData.trim()) {
        users = JSON.parse(fileData);
      }
    } catch (e) {
      // ignore missing file
    }

    const existingIndex = users.findIndex(u => u.id === userData.id);
    if (existingIndex > -1) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...userData
      };
    } else {
      users.push(userData);
    }

    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    const tmpPath = usersFilePath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(users, null, 2), "utf8");
    await fs.rename(tmpPath, usersFilePath);
  } catch (err) {
    console.warn("[UserStore] Local file write failed (expected on live):", err.message);
  }
}

export async function deleteUser(id) {
  // 1. Delete from Supabase if configured
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

  // 2. Delete from local users.json
  try {
    let users = [];
    try {
      const fileData = await fs.readFile(usersFilePath, "utf8");
      if (fileData.trim()) {
        users = JSON.parse(fileData);
      }
    } catch (e) {
      // ignore
    }

    users = users.filter(u => u.id !== id);

    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    const tmpPath = usersFilePath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(users, null, 2), "utf8");
    await fs.rename(tmpPath, usersFilePath);
  } catch (err) {
    console.warn("[UserStore] Local file delete write failed (expected on live):", err.message);
  }
}
