-- ============================================================================
-- SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Project: Blog Website
-- Use: Run this script in the Supabase SQL Editor (https://supabase.com)
--      to create all necessary tables, indexes, and storage configurations.
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Table: posts
-- Stores blog post content, metrics, formats, and SEO configurations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(255) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(100),
    format VARCHAR(50) DEFAULT 'image', -- e.g., 'image', 'gallery', 'video', 'audio'
    status VARCHAR(50) DEFAULT 'draft',  -- e.g., 'draft', 'published'
    author VARCHAR(100) DEFAULT 'Admin',
    excerpt TEXT,
    content TEXT,
    image TEXT,
    "galleryImages" JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    gallery JSONB DEFAULT '[]'::jsonb,        -- Array of detailed gallery item objects
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    tags JSONB DEFAULT '[]'::jsonb,           -- Array of strings (e.g., ["minimalism", "lifestyle"])
    comments INTEGER DEFAULT 0,
    "totalViews" INTEGER DEFAULT 0,
    "viewsByDate" JSONB DEFAULT '{}'::jsonb,   -- Historical views tracker: {"YYYY-MM-DD": number}
    "isSticky" BOOLEAN DEFAULT false,
    "isFeatured" BOOLEAN DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "publishedAt" TIMESTAMP WITH TIME ZONE
);

-- Indexing for posts table to optimize common lookups
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts("publishedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts("isFeatured") WHERE "isFeatured" = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_sticky ON posts("isSticky") WHERE "isSticky" = true;

-- ----------------------------------------------------------------------------
-- 2. Table: blog_users
-- Stores user profiles, credentials (admin dashboard users), roles and expirations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',        -- e.g., 'admin', 'editor', 'user'
    status VARCHAR(50) DEFAULT 'active',    -- e.g., 'active', 'suspended'
    avatar TEXT,
    bio TEXT,
    password TEXT NOT NULL,                 -- Hashed password
    expires_at TIMESTAMP WITH TIME ZONE,    -- Expiration date for temp/guest accounts
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for blog_users table
CREATE INDEX IF NOT EXISTS idx_blog_users_email ON blog_users(email);

-- ----------------------------------------------------------------------------
-- 3. Table: app_settings
-- Key-value table for global site configuration (theme, slides, layouts).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(255) PRIMARY KEY, -- e.g. 'dashboard_app_settings'
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- Table: contacts
-- Stores contact form submissions/messages.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    captcha_question VARCHAR(255),
    captcha_answer VARCHAR(255)
);

-- ----------------------------------------------------------------------------
-- 4. Storage Bucket Setup
-- The project expects a Supabase storage bucket named: blog-media
-- For uploading post images/audios/videos.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Access Policies: Allow public read-only access to all media
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

-- Storage Access Policies: Allow authenticated/service role inserts & updates
CREATE POLICY "All Access for Service Role"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'blog-media')
WITH CHECK (bucket_id = 'blog-media');

-- ----------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Configuration
-- For security, tables should have RLS configured. Because the admin backend 
-- uses the service role key, it naturally bypasses RLS policies to perform writes.
-- ----------------------------------------------------------------------------

-- Enable Row Level Security on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Posts Policies: Everyone (anonymous/public) can read published posts
CREATE POLICY "Allow public read of published posts" ON posts
    FOR SELECT
    USING (status = 'published');

-- Posts Policies: Allow complete read/write access to service_role (Admin Panel)
CREATE POLICY "Allow all access to service_role on posts" ON posts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Blog Users Policies: Allow all access to service_role (Admin Panel)
CREATE POLICY "Allow all access to service_role on blog_users" ON blog_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- App Settings Policies: Everyone can read settings
CREATE POLICY "Allow public read of app settings" ON app_settings
    FOR SELECT
    USING (true);

-- App Settings Policies: Allow all access to service_role (Admin Panel)
CREATE POLICY "Allow all access to service_role on app_settings" ON app_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Contacts Policies: Allow public anonymous insertion of messages
CREATE POLICY "Allow public insert of messages" ON contacts
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Contacts Policies: Allow all access to service_role (Admin Panel)
CREATE POLICY "Allow all access to service_role on contacts" ON contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. Trigger to Auto-Update 'updatedAt'/'updated_at' columns
-- Automatically updates timestamp when rows are edited.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF TG_TABLE_NAME = 'posts' THEN
            NEW."updatedAt" = now();
        ELSIF TG_TABLE_NAME = 'app_settings' THEN
            NEW.updated_at = now();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trigger_update_posts_timestamp ON posts;
CREATE TRIGGER trigger_update_posts_timestamp
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_update_settings_timestamp ON app_settings;
CREATE TRIGGER trigger_update_settings_timestamp
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
