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
   - Access the admin dashboard at `/dashboard`. 
   - **Login Credentials**:
     * **Admin Email**: `admin@orin.com` | **Password**: `admin123`

---

## Production Setup (Supabase)

To prepare the project for production, you must set up your database and user/settings storage (Supabase).

### Step 1: Database Setup (Supabase)

1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new project. Note your **Project URL** and **API Keys** (under *Project Settings > API*).
3. Open the **SQL Editor** in your Supabase dashboard.
4. Click **New Query**, copy the contents of the database schema file [db_schema.sql](./db_schema.sql) from this folder, and paste it into the editor.
5. Click **Run** to create the tables (`posts`, `blog_users`, `app_settings`, `contacts`), indexes, row-level security (RLS) policies, and storage configurations.
6. Under **Storage**, confirm that a public bucket named `blog-media` has been created. (If not, create one manually and set its access to **Public**).

#### Enabling Google OAuth (Optional)
If you wish to allow editors and admins to log in with Google OAuth:
1. Go to **Authentication > Providers** in the Supabase Dashboard and enable **Google**.
2. Set up your Client ID and Client Secret from the Google Cloud Console.
3. Configure the redirect URLs so that they point back to your site's Auth Callback handler.

#### Storage CORS Configuration
To allow cross-origin image uploads directly from the admin dashboard:
1. Go to **Storage > Settings** in the Supabase Dashboard.
2. Select your `blog-media` bucket and configure the CORS rules to allow your domain (e.g. `http://localhost:3000` or your production domain), specifying allowed methods (GET, POST, PUT, DELETE).

### Step 2: Configure Environment Variables

1. Copy the environment variables template `env.example` in this folder to a new file named `.env.local` in the project root folder:
   ```bash
   cp document/env.example .env.local
   ```
2. Open `.env.local` and replace the placeholder values with your actual project keys:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key
   ```
   *(Note: The `SUPABASE_SERVICE_ROLE_KEY` is a secret key that is only accessed on the server. Do not expose it to the browser.)*

3. **Domain Security / Images configuration**:
   By default, `next.config.mjs` contains a wildcard pattern `*.supabase.co` to support loading images from any Supabase project. If you wish to lock this down to your project only, replace `*.supabase.co` with your specific project's hostname (e.g., `your_project_ref.supabase.co`).

---

## Database Tables Overview

The schema defined in [db_schema.sql](./db_schema.sql) configures 4 main tables:
- **`posts`**: Stores all blog articles, categories, views, status, formats, and metadata.
- **`blog_users`**: Stores admin/dashboard users' names, emails, roles, active status, bio, and login details.
- **`app_settings`**: Stores global layout/appearance configurations (sliders, post count limits, sidebar position, and persistent database seeding markers).
- **`contacts`**: Stores contact/feedback messages submitted via the Contact Us form.

---

## Deployment (Production)

This is a standard Next.js application that can be deployed to any Node-compatible hosting provider:

- **Vercel**:
  1. Push your project code to a git repository (GitHub, GitLab, or Bitbucket).
  2. Import the repository in your [Vercel Dashboard](https://vercel.com/).
  3. Configure the environment variables exactly as in your `.env.local`.
  4. Click **Deploy**.

- **Other Hosting Providers (Railway, Netlify, Self-Hosted Docker)**:
  - This app conforms to standard Next.js building rules. You can build it using `npm run build` and run using `npm run start` or dockerize it. Ensure the backend environment variables are supplied at build/runtime.
