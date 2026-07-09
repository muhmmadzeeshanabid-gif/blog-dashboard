import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder"
);

// Public client — safe for browser use (auth only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
  },
});

// Server-side admin client — uses service role key, bypasses RLS.
// NEVER import this in client components.
// Bug #3 fix: Previously fell back silently to the anon client when the
// service role key was missing, causing RLS-bypass operations to fail
// without any indication. Now logs a clear warning so the issue is visible.
export const supabaseAdmin = (typeof window === "undefined" && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    })
  : (() => {
      if (typeof window === "undefined" && isSupabaseConfigured && !supabaseServiceRoleKey) {
        console.warn(
          "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. " +
          "supabaseAdmin is falling back to the anon client. " +
          "Operations that require RLS bypass (admin reads/writes) will not work correctly."
        );
      }
      return supabase;
    })();

