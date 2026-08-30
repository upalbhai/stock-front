# SEO Blogs Module

The SEO Blogs module allows MiniHisab to publish marketing content, tutorials, and business tips directly on the public-facing website (`/blog`). It is designed to boost organic search rankings (SEO) and provide value to potential and existing users.

## Access & Permissions
The blog CMS is strictly a **Platform Level** feature. Only Superadmins with specific permissions can access it.
- **Accessing the CMS:** Navigate to **Platform Dashboard** -> **Blogs**.
- **Role Assignment:** Grant `blogs` when **creating** a new System Admin (Platform Dashboard -> Users -> Add System Admin -> toggle `blogs`). Editing permissions on existing admins is not yet available — see [blogs-module.md](../../../docs/blogs-module.md#gap-7-cannot-assign-blogs-to-existing-admins).
- **Publishing Control:** Users with the `blogs` module get `read`, `create`, `update`, `delete`, and `publish` actions. A user without `publish` (once per-action assignment exists) can draft posts but cannot make them live. Until backend Gap #1 is fixed, do not rely on publish restrictions for security.

## Creating & Editing Posts
1. **Title & Content:** Enter your post title. The URL slug will auto-generate but can be edited. Use the rich text editor to write and format your content, including adding inline images.
2. **Excerpt:** Add a short summary that will appear on the blog listing page and in SEO meta tags (if SEO Description is left blank).
3. **Tags:** Press 'Enter' after typing a tag to add it. Tags help categorize the content visually.
4. **Cover Image:** Upload a cover image. This image appears at the top of the article and on the blog listing page.

## SEO Best Practices
This module includes built-in technical SEO features. Use the **SEO & Meta** panel to optimize your posts:

- **SEO Title:** Overrides the main post title in the browser tab and search engine results. Keep it under 60 characters for best results.
- **SEO Description:** Overrides the excerpt in search engine results. Aim for 150-160 characters.
- **Canonical URL:** If you are cross-posting content that originally appeared elsewhere (e.g., Medium, another blog), paste the original URL here. This prevents search engines from penalizing minihisab.com for duplicate content.
- **Hide from search engines (noindex):** Check this toggle if you want the post to be accessible via direct link but hidden from Google (useful for private announcements, landing pages, or draft content that accidentally went live).
- **Open Graph (OG) Images:** When a link is shared on social media (Twitter, LinkedIn, WhatsApp), it looks for an OG Image. The CMS automatically uses your **Cover Image** for this.
  - **Recommendation:** Use images with a resolution of **1200x630 pixels** (1.91:1 ratio) for the best appearance on social media previews.

## Architecture & Caching
- **Frontend Path:** Public blogs are rendered at `/blog` and `/blog/[slug]`.
- **Caching:** The Next.js frontend fetches blog data and caches it. The sitemap dynamically includes all published posts to ensure search engines can discover new content immediately.
- **JSON-LD Schema:** Every blog post automatically injects `BlogPosting` structured data into the page, which helps Google understand the article structure and author details.
