import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { getAbsoluteApiUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog - MiniHisab",
  description: "Read the latest updates, tutorials, and business tips from the MiniHisab team.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog - MiniHisab",
    description: "Read the latest updates, tutorials, and business tips from the MiniHisab team.",
    url: "/blog",
    type: "website",
  },
};

async function getBlogs(): Promise<BlogPost[]> {
  try {
    const url = getAbsoluteApiUrl("/blogs?limit=50");
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.posts || [];
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await getBlogs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MiniHisab Blog",
    description: "Latest news, business tips, and updates from MiniHisab.",
    url: "https://minihisab.com/blog",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://minihisab.com/blog/${post.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ name: "Blog", url: "/blog" }]} />
        <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Our Blog</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Latest news, business tips, and updates from MiniHisab.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {posts.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No posts found. Check back later!
          </div>
        ) : (
          posts.map((post) => (
            <article key={post._id} className="flex flex-col items-start justify-between">
              <div className="relative w-full">
                {post.coverImage ? (
                  <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] lg:aspect-[3/2] rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full rounded-2xl bg-muted/30 flex items-center justify-center sm:aspect-[2/1] lg:aspect-[3/2]">
                    <span className="text-muted-foreground font-medium">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
              </div>
              
              <div className="max-w-xl">
                <div className="mt-8 flex items-center gap-x-4 text-xs">
                  <time dateTime={post.publishedAt} className="text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : ''}
                  </time>
                  {post.tags && post.tags.length > 0 && (
                    <span className="relative z-10 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/20">
                      {post.tags[0]}
                    </span>
                  )}
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 group-hover:text-primary">
                    <Link href={APP_ROUTES.blogPost(post.slug)}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      </div>
    </>
  );
}
