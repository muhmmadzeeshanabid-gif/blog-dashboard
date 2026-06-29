# Modern Blog Website & Admin Dashboard Documentation

Welcome to the documentation folder for the Modern Blog Website. This folder contains all the files, database queries, and guides required to set up, deploy, and understand the project.

---

## 📁 Folder Contents

* 📄 **[README.md](file:///c:/Users/T14s/Desktop/blog-website/document/README.md)** - This guide (overview of folders and files).
* 🗄️ **[db_schema.sql](file:///c:/Users/T14s/Desktop/blog-website/document/db_schema.sql)** - Database queries to set up tables, indexes, RLS policies, and storage buckets in Supabase/PostgreSQL.
* 🛠️ **[setup_guide.md](file:///c:/Users/T14s/Desktop/blog-website/document/setup_guide.md)** - Step-by-step instructions on setting up packages, local running, Supabase configuration, Sanity settings, and deployment.
* 🏗️ **[architecture.md](file:///c:/Users/T14s/Desktop/blog-website/document/architecture.md)** - Technical overview of directories, Next.js routing, and the local JSON file database fallback.
* 🔑 **[env.example](file:///c:/Users/T14s/Desktop/blog-website/document/env.example)** - Environment variable template containing the key names required for database/CMS setup.

---

## 🔍 Codebase Structure & File Explanations

Here is a detailed breakdown of the directories and key files, explaining what code they contain and what their role is:

### 1. Root Configuration Files
* **`package.json`**: Contains list of npm scripts (`dev`, `build`, `start`) and dependencies. Uses React 19, Next.js 16, and TailwindCSS v4.
* **`next.config.mjs`**: Next.js core settings. Configures image domains (e.g. Supabase, Sanity) so that external image links load successfully in `<Image />` tags.
* **`jsconfig.json`**: Configures absolute path mapping (e.g., `@/*` references `src/*` or `@/backend/*` references `src/app/(backend)/*`) for cleaner import statements.

### 2. Local Database Folder (`data/`)
*When Supabase credentials are not found, the site writes its data locally to these JSON files:*
* **`data/posts.json`**: Stores all blog articles, categories, views, and content details.
* **`data/users.json`**: Stores admin/dashboard users' names, emails, roles, and passwords.
* **`data/app-settings.json`**: Stores website appearance settings (active sliders, theme colors, layout options).

### 3. Business Logic & Integrations (`src/app/`)
* **`src/app/(backend)/lib/supabase.js`**: Initializes connection to the Supabase database. Handles service role authentication.
* **`src/app/(backend)/lib/postStore.js`**: Core controller for blog posts. Handles reading/writing from Supabase tables or falling back to `data/posts.json` locally.
* **`src/app/(backend)/lib/userStore.js`**: Manages users login/profiles and auto-seeds local users into Supabase on the first connection.
* **`src/app/(backend)/lib/appSettings.js`**: Gets and updates general dashboard settings and slider configurations.
* **`src/app/(frontend)/lib/sanity.js`**: Queries posts from Sanity CMS when using Sanity as a content source.
* **`src/app/(frontend)/lib/authContext.jsx`**: React Context that handles session persistence, logins, and logouts.
* **`src/app/(dashboard)/lib/notificationsContext.jsx`**: Manages user notifications inside the admin panel.

### 4. Pages & Routing (`src/app/`)
* **`src/app/layout.jsx` / `src/app/(frontend)/page.jsx`**: Root HTML framework and homepage layout showing the slider, recent posts, and widgets.
* **`src/app/globals.css`**: Configures TailwindCSS v4 variables, custom themes, fonts, and global overrides.
* **`src/app/(frontend)/posts/`**: Dynamic folder displaying single posts (handles audio players, image galleries, embedded videos).
* **`src/app/(frontend)/categories/`**: Dynamically filters posts based on selected category tags.
* **`src/app/(frontend)/login/`**: Simple, responsive form page for admin dashboard authentication.
* **`src/app/(dashboard)/dashboard/`**: Admin panel pages:
  * `dashboard/page.jsx` & `OverviewClient.jsx`: Analytical charts showing traffic trends.
  * `dashboard/posts/` & `PostsClient.jsx` / `PostEditorClient.jsx`: Creates, updates, or deletes blog posts.
  * `dashboard/categories/` & `CategoriesClient.jsx`: Category manager.
  * `dashboard/settings/` & `SettingsClient.jsx`: Visual customization manager (accents, site name/desc settings, sliders, sidebars).
  * `dashboard/users/` & `UsersClient.jsx`: Manages users and roles.
* **`src/app/(backend)/api/`**: API routes handling image uploads, contact forms, and analytical page views.

### 5. UI Components (`src/app/(frontend)/components/`)
* **`components/header/` / `components/footer/`**: Global site navigation, category lists, search bar, and social widgets.
* **`components/slider/`**: Carousel showing featured posts at the top of the homepage.
* **`components/recent-posts/`**: Masonry grid for standard posts (reordered to keep pinned and slider posts side-by-side).
* **`components/post/`**: Individual layout handlers:
  * `PostAudioPlayer.jsx`: Audio player with custom styled wave seekbars.
  * `PostComments.jsx`: Comments section widget.
* **`components/widgets/`**: Sidebar items (About author, Social links, Newsletter subscribe).
* **`components/utils/`**: Reusable components like lightbox galleries and portals.

---

## ⚡ Quick Start (Run Locally in 2 Minutes)

To run the application locally without configuring any external databases (using the built-in local JSON fallback database):

1. **Install package dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Explore the app**:
   - Frontend blog: [http://localhost:3000](http://localhost:3000)
   - Admin control panel: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Login Credentials**:
     * **Admin Email**: `admin@orin.com` | **Password**: `admin123`
     * **Editor Email**: `muhmmadzeeshanabid@gmail.com` | **Password**: `shanii`
