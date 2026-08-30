import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_ROUTES } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/blogs?limit=100`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const posts = json.data?.posts || [];
      posts.forEach((post: any) => {
        routes.push({
          url: absoluteUrl(`/blog/${post.slug}`),
          lastModified: new Date(post.updatedAt || post.publishedAt || lastModified),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error("Error generating blog sitemap:", error);
  }

  return routes;
}
