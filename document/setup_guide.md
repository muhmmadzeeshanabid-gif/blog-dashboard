# Local Setup and Deployment Guide

This guide walks you through setting up and running the Blog Website project from scratch, including database installation and CMS configuration.

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x recommended)
- **npm** (comes with Node.js)
- A **code editor** (like VS Code)

---

## Quick Start (Local Fallback Mode)

This project has a built-in **zero-config local database fallback**. If no external database keys are configured, it will save data to local `.json` files inside the `data/` folder.

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open the Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
   - Access the admin dashboard at `/dashboard` (no login credentials required in local mode).

---

## Production Setup (Supabase & Sanity)

To prepare the project for production, you must set up your database (Supabase) and content manager (Sanity).

### Step 1: Database Setup (Supabase)

1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new project. Note your **Project URL** and **API Keys** (under *Project Settings > API*).
3. Open the **SQL Editor** in your Supabase dashboard.
4. Click **New Query**, copy the contents of the database schema file [db_schema.sql](file:///c:/Users/T14s/Desktop/blog-website/document/db_schema.sql) from this folder, and paste it into the editor.
5. Click **Run** to create the tables (`posts`, `blog_users`, `app_settings`), indexes, row-level security (RLS) policies, and storage configurations.
6. Under **Storage**, confirm that a public bucket named `blog-media` has been created. (If not, create one manually and set its access to **Public**).

### Step 2: Content Management Setup (Sanity CMS)

The project reads blog posts from Sanity CMS as an alternative content source (configured via `src/lib/sanity.js`).

1. Log in to [Sanity.io](https://www.sanity.io/) and create a new project.
2. Note your **Project ID** and **Dataset name** (default is usually `production`).
3. Under *API settings* of your Sanity project dashboard:
   - Create a **Read Token** (with Viewer permissions).
   - Create a **Write Token** (with Editor/Developer permissions).
4. Define a `post` schema in your Sanity Studio. The project queries documents with `_type == "post"` and expects the following fields:
   - `title` (string)
   - `slug` (slug)
   - `category` (string)
   - `format` (string - e.g. "image", "gallery", "video", "audio")
   - `status` (string - "draft" or "published")
   - `author` (string)
   - `excerpt` (text)
   - `content` (text or block content)
   - `image` (image)
   - `tags` (array of strings)
   - `isSticky` (boolean)
   - `isFeatured` (boolean)
   - `videoUrl` (string)
   - `audioUrl` (string)
   - `publishedAt` (datetime)

### Step 3: Configure Environment Variables

1. Copy the environment variables template `env.example` in this folder to a new file named `.env.local` in the project root folder:
   ```bash
   cp document/env.example .env.local
   ```
2. Open `.env.local` and replace the placeholder values with your actual project keys:

   ```env
   # Sanity
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_actual_sanity_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
   NEXT_PUBLIC_SANITY_READ_TOKEN=your_viewer_token
   SANITY_WRITE_TOKEN=your_editor_token

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key
   ```
   *(Note: The `SUPABASE_SERVICE_ROLE_KEY` is a secret key that is only accessed on the server. Do not expose it to the browser.)*

### Step 4: Run the Sync Scripts (Optional)

If you want to sync mock post data into your newly configured Supabase database, you can run the sync script:

```bash
node scratch/sync-supabase-posts.mjs
```
This will insert the default articles and posts directly into your Supabase database table.

---

## Deployment (Production)

This is a Next.js application that can be deployed to Vercel:

1. Push your project code to a git repository (GitHub, GitLab, or Bitbucket).
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. In the project settings, configure the environment variables exactly as in your `.env.local`.
4. Click **Deploy**.
