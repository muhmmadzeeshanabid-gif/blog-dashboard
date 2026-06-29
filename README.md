# Modern Blog Website & Admin Dashboard

A state-of-the-art blog platform built with **Next.js (App Router)**, **React 19**, and **TailwindCSS v4**.

---

## 📁 Project Documentation & Setup

All setup guides, environment variables templates, database schemas, and technical architectures have been consolidated into the **`document/`** folder:

👉 **[Go to the Document Folder](document/README.md)**

Inside, you will find:
1. **[Local Setup & Deployment Guide](document/setup_guide.md)** - Detailed instructions on running the project locally, setting up **Supabase** and **Sanity CMS**, and deploying the site to **Vercel**.
2. **[Database SQL Schema Setup](document/db_schema.sql)** - Database queries to recreate all tables, indexes, storage buckets, and policies in Supabase/PostgreSQL.
3. **[Technical Architecture Details](document/architecture.md)** - A technical deep-dive into folders, Next.js routing, and the local JSON file database fallback system.
4. **[Environment Variables Template](document/env.example)** - Variable names required to run the project.

---

## Quick Start (Run Locally in 2 Minutes)

To run the application locally without configuring any external databases (using the built-in local JSON fallback database):

1. **Install package dependencies**:
   ```bash
   npm install
   ```

2. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

3. **Explore the app**:
   - Frontend blog: [http://localhost:3000](http://localhost:3000)
   - Admin control panel: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
