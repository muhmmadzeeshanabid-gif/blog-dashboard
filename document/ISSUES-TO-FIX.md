# Template Sale-Readiness Issues

This document lists all issues found during a full codebase audit. These must be resolved before selling the template to ensure buyers get a clean, working, professional product.

---

## 1. Dead Sanity Code (CRITICAL)

The project migrated to Supabase but Sanity artifacts remain. **No file in the codebase imports or uses `sanity.js`** ΓÇö it is 100% dead code.

### Files to Clean

| Action | File | Details |
|--------|------|---------|
| DELETE | `src/app/(backend)/lib/sanity.js` | Full Sanity client with GROQ queries ΓÇö never imported anywhere |
| REMOVE deps | `package.json` | Remove `@sanity/client`, `@sanity/image-url`, `next-sanity` from dependencies |
| REMOVE vars | `document/env.example` | Remove all `NEXT_PUBLIC_SANITY_*` and `SANITY_WRITE_TOKEN` variables |
| REWRITE section | `document/setup_guide.md` | Remove entire "Step 2: Content Management Setup (Sanity CMS)" section |
| REMOVE line | `document/README.md` (line 39) | Remove reference to `src/app/(frontend)/lib/sanity.js` (file doesn't even exist at that path) |
| REWRITE | `document/architecture.md` (line 52) | Remove "Sanity CMS" from hybrid storage description ΓÇö it's Supabase + local JSON only |
| REMOVE line | `document/README.md` (line 13) | Remove "Sanity settings" from setup_guide.md description |
| REMOVE line | `document/README.md` (line 25) | Remove "Sanity" from next.config.mjs description |

### After removal, run:
```bash
npm uninstall @sanity/client @sanity/image-url next-sanity
```

---

## 2. Personal / Private Data Exposed (CRITICAL)

Real personal data is present in the JSON files that ship with the template. This data gets auto-seeded into the buyer's Supabase if they connect it.

### `data/users.json` ΓÇö Reset completely

Current state contains:
- `muhmmadzeeshanabid@gmail.com` with password `shanii`
- `desirekhan713123@gmail.com` with password `IAdDzr`
- `mazeemali150@gmail.com` with password `F#SY6y`
- Duplicate entry (same email `muhmmadzeeshanabid@gmail.com` appears twice)
- Avatar URLs pointing to a personal Supabase bucket

**Replace with:**
```json
[
  {
    "id": "mock-admin-id",
    "name": "Orin Admin",
    "email": "admin@orin.com",
    "role": "admin",
    "status": "active",
    "avatar": "/images/default-avatar.jpg",
    "bio": "Developer of WordPress themes and writer of minimalist stories.",
    "password": "admin123",
    "expiresAt": null,
    "joinedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### `data/contacts.json` ΓÇö Empty it

Replace with:
```json
[]
```

### `data/action-notifications.json` ΓÇö Empty it

Replace with:
```json
[]
```

### `data/app-settings.json` ΓÇö Replace Supabase URLs

The `contactSlides` array contains an image URL pointing to `quiyddkryrztviyqgibb.supabase.co`. Replace it with a local image path (e.g., `/images/contact-hero-1.png`).

---

## 3. Hardcoded Supabase Project URL (CRITICAL)

Your personal Supabase project reference (`quiyddkryrztviyqgibb`) is exposed in multiple places. A buyer's project will have a different reference, so these will show broken images.

| File | What to fix |
|------|-------------|
| `next.config.mjs` (line 20) | Replace `hostname: 'quiyddkryrztviyqgibb.supabase.co'` with a wildcard or comment instructing buyer to replace |
| `data/users.json` | All avatar URLs ΓÇö replace with local paths (covered in section 2 above) |
| `data/app-settings.json` | Slide image URL ΓÇö replace with local path (covered in section 2 above) |

### Recommended fix for `next.config.mjs`:

```js
{
  protocol: 'https',
  hostname: '*.supabase.co', // Matches any Supabase project
},
```

---

## 4. Windows Absolute File Paths in Documentation (HIGH)

All file links in docs use `file:///c:/Users/T14s/Desktop/blog-website/...` which:
1. Exposes your personal machine path
2. Won't work for any buyer (different OS, different paths)
3. Looks unprofessional for a paid product

### Files affected:

| File | Occurrences |
|------|-------------|
| `document/README.md` | 5 links (lines 11-15) |
| `document/architecture.md` | 3 links (lines 78, 98, 102) |
| `document/setup_guide.md` | 1 link (line 48) |

### Fix:
Replace all `file:///c:/Users/T14s/Desktop/blog-website/document/filename.md` with relative links like `[filename.md](./filename.md)`.

Replace all `file:///c:/Users/T14s/Desktop/blog-website/src/...` with relative paths like `../src/app/(backend)/lib/supabase.js`.

---

## 5. Post Seeding ΓÇö Re-seed Bug on Cold Starts (HIGH)

The `ensureDatabaseSeeded()` function in `postStore.js` uses an in-memory flag (`isSeededChecked`) that resets on every server restart / Vercel cold start. If a buyer deletes all posts and a cold start occurs, posts will re-seed unexpectedly.

### Current behavior:
```js
let isSeededChecked = false; // resets on cold start

async function ensureDatabaseSeeded() {
  if (useLocalFallback || isSeededChecked) return;
  isSeededChecked = true; // only lives in memory
  if (count === 0) { /* seed */ }
}
```

### Fix:
Store a persistent `"posts_seeded"` flag in the `app_settings` table after first seed. Check that flag instead of relying on memory.

```js
async function ensureDatabaseSeeded() {
  if (useLocalFallback) return;

  // Check persistent flag first
  const { data: marker } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "posts_seeded")
    .maybeSingle();

  if (marker) return; // already seeded, never re-seed

  const { count, error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (error) {
    useLocalFallback = true;
    return;
  }

  if (count === 0) {
    const seedPosts = createSeedPosts(new Date());
    const { error: insertError } = await supabase
      .from("posts")
      .upsert(seedPosts, { onConflict: "id", ignoreDuplicates: true });

    if (!insertError) {
      // Mark as seeded permanently
      await supabase.from("app_settings").upsert({
        key: "posts_seeded",
        value: { seeded: true, at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
    }
  }
}
```

---

## 6. Setup Guide is Incomplete / Misleading (HIGH)

`document/setup_guide.md` has these problems:

| Issue | Fix |
|-------|-----|
| Tells buyers to set up Sanity (Step 2) ΓÇö Sanity is not used | Remove entire Sanity section |
| No mention of Google OAuth setup | Add instructions for enabling Google provider in Supabase Auth settings |
| No mention of updating `next.config.mjs` image hostname | Add step: "Replace the Supabase hostname in `next.config.mjs` with your project's hostname" |
| Only mentions Vercel for deployment | Add notes for other hosts (Netlify, Railway, self-hosted) or at minimum clarify it's a standard Next.js app |
| Doesn't mention the `contacts` table | The `db_schema.sql` creates it ΓÇö setup guide should acknowledge all 4 tables |
| No mention of Supabase Storage CORS | Buyers may need this for cross-origin image uploads |

---

## 7. Email Validation Restricts to Gmail Only (MEDIUM)

In `UsersClient.jsx` (lines 444-448, 531-535) and `api/users/sync/route.js` (line 15), user emails are validated against:

```js
const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
```

This means a buyer can ONLY create users with `@gmail.com` addresses (or `admin@orin.com` as a hardcoded exception). For a generic template sold to anyone, this is too restrictive.

### Fix:
Replace with a standard email regex that accepts any domain:
```js
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

And remove the `isAdminOrin` special case ΓÇö just let any valid email pass.

---

## 8. Admin Detection via Email String Matching (MEDIUM)

In `authContext.jsx` (line 55):
```js
if (lower.includes("admin") || lower === "admin@orin.com") {
  return "admin";
}
```

This means ANY email containing the word "admin" gets admin privileges. For example `administrator@company.com` or `admin-support@test.com` would auto-elevate to admin.

### Fix:
Role should come from the database, not from email string matching. The `blog_users` table already has a `role` column ΓÇö use that as the source of truth.

---

## 9. Misc Cleanup (LOW)

| Issue | File | Action |
|-------|------|--------|
| Debug file in root | `layout-debug.json` | Delete |
| Test upload files | `public/uploads/avatars/*`, `public/uploads/posts/*` | Delete all personal test files, keep the directories empty (or add a `.gitkeep`) |
| Package name is `"blog-website"` | `package.json` line 2 | Consider renaming to something brandable like `"orin-blog-template"` |
| README references "Next.js 16" | `document/README.md` | Verify this is correct (Next.js 16 is very recent) ΓÇö currently `package.json` shows `"next": "16.2.9"` so it's accurate |

---

## Summary Checklist

- [ ] Delete `src/app/(backend)/lib/sanity.js`
- [ ] Remove Sanity deps from `package.json` + run `npm install`
- [ ] Remove Sanity vars from `document/env.example`
- [ ] Clean `data/users.json` ΓÇö only keep admin with local avatar
- [ ] Empty `data/contacts.json` ΓåÆ `[]`
- [ ] Empty `data/action-notifications.json` ΓåÆ `[]`
- [ ] Replace Supabase URLs in `data/app-settings.json` with local paths
- [ ] Fix `next.config.mjs` ΓÇö replace hardcoded hostname with wildcard
- [ ] Fix all `file:///c:/Users/T14s/...` links in docs ΓåÆ relative paths
- [ ] Rewrite `document/setup_guide.md` ΓÇö remove Sanity, add OAuth/Storage/image domain steps
- [ ] Update `document/README.md` ΓÇö remove Sanity references
- [ ] Update `document/architecture.md` ΓÇö remove Sanity from hybrid description
- [ ] Fix post re-seeding bug (persistent flag in `app_settings`)
- [ ] Fix email validation ΓÇö allow all domains, not just Gmail
- [ ] Fix admin detection ΓÇö use DB role, not email string
- [ ] Delete `layout-debug.json`
- [ ] Clear `public/uploads/` test files
