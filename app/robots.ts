import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/invite/", "/login"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/llms.txt", "/features", "/services", "/pricing", "/blog", "/for/"],
        disallow: ["/dashboard/", "/api/", "/invite/", "/login"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
