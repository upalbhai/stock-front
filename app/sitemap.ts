import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_ROUTES, getAbsoluteApiUrl } from "@/lib/seo";
import { STATIC_BLOG_POSTS } from "@/config/blog-posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const getPriority = (path: string): number => {
    if (path === "/") return 1.0;
    if (path === "/blog" || path === "/pricing") return 0.9;
    if (path.startsWith("/for/")) return 0.85;
    if (path.startsWith("/features")) return 0.8;
    return 0.7;
  };

  const getFrequency = (path: string): "weekly" | "monthly" => {
    if (path === "/" || path === "/blog" || path.startsWith("/for/")) {
      return "weekly";
    }
    return "monthly";
  };

  const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: getFrequency(path),
    priority: getPriority(path),
  }));

  const addedBlogSlugs = new Set<string>();

  try {
    const url = getAbsoluteApiUrl("/blogs?limit=100");
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const posts = json.data?.posts || [];
      posts.forEach((post: any) => {
        addedBlogSlugs.add(post.slug);
        routes.push({
          url: absoluteUrl(`/blog/${post.slug}`),
          lastModified: new Date(post.updatedAt || post.publishedAt || lastModified),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    // API offline, fallback handles below
  }

  // Include static blog posts
  STATIC_BLOG_POSTS.forEach((post) => {
    if (!addedBlogSlugs.has(post.slug)) {
      addedBlogSlugs.add(post.slug);
      routes.push({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: new Date(post.updatedAt || post.publishedAt || lastModified),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  });

  return routes;
}
