import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// ─── Sanity Client (Read) ──────────────────────────────────────────────────
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
  useCdn: true, // fast cached reads
  token: process.env.NEXT_PUBLIC_SANITY_READ_TOKEN,
});

// ─── Sanity Client (Write — server side only) ─────────────────────────────
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// ─── Image URL Builder ────────────────────────────────────────────────────
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  return builder.image(source);
}

// ─── GROQ Queries ─────────────────────────────────────────────────────────

// Saray published posts
export const ALL_POSTS_QUERY = `*[_type == "post" && status == "published"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  format,
  status,
  author,
  excerpt,
  "image": image.asset->url,
  tags,
  isSticky,
  isFeatured,
  totalViews,
  comments,
  videoUrl,
  audioUrl,
  publishedAt,
  _createdAt,
  _updatedAt
}`;

// Single post by slug
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  category,
  format,
  status,
  author,
  excerpt,
  content,
  "image": image.asset->url,
  tags,
  isSticky,
  isFeatured,
  totalViews,
  comments,
  videoUrl,
  audioUrl,
  publishedAt,
  _createdAt,
  _updatedAt
}`;

// Featured posts
export const FEATURED_POSTS_QUERY = `*[_type == "post" && status == "published" && isFeatured == true] | order(publishedAt desc)[0...6] {
  _id,
  title,
  "slug": slug.current,
  category,
  "image": image.asset->url,
  excerpt,
  publishedAt
}`;

// Dashboard - all posts (draft + published)
export const DASHBOARD_POSTS_QUERY = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  format,
  status,
  author,
  excerpt,
  "image": image.asset->url,
  tags,
  isSticky,
  isFeatured,
  totalViews,
  comments,
  publishedAt,
  _createdAt,
  _updatedAt
}`;
