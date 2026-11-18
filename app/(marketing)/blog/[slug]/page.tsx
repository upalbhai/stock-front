import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BlogPost } from "@/lib/types";
import { APP_ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/jsonld";
import { getAbsoluteApiUrl } from "@/lib/seo";
import { STATIC_BLOG_POSTS } from "@/config/blog-posts";

interface Props {
  params: { slug: string };
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const url = getAbsoluteApiUrl(`/blogs/${slug}`);
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.post) return json.data.post;
    }
  } catch (error) {
    // Fallback to static post
  }

  const staticPost = STATIC_BLOG_POSTS.find((p) => p.slug === slug);
  return (staticPost as unknown as BlogPost) || null;
}

export async function generateStaticParams() {
  const staticSlugs = STATIC_BLOG_POSTS.map((p) => ({ slug: p.slug }));

  try {
    const url = getAbsoluteApiUrl("/blogs?limit=100");
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const posts = json.data?.posts || [];
      const apiSlugs = posts.map((post: any) => ({ slug: post.slug }));
      const allSlugs = [...staticSlugs];
      apiSlugs.forEach((item: { slug: string }) => {
        if (!allSlugs.some((s) => s.slug === item.slug)) {
          allSlugs.push(item);
        }
      });
      return allSlugs;
    }
  } catch (error) {
    // Return static slugs
  }

  return staticSlugs;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `https://minihisab.com/blog/${post.slug}`;
  const imageUrl = post.ogImage || post.coverImage;

  return {
    title,
    description,
    alternates: {
      canonical: post.canonicalUrl || url,
    },
    robots: {
      index: !post.noindex,
      follow: !post.noindex,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      authors: typeof post.authorId === 'object' && post.authorId?.name ? [post.authorId.name] : [],
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  // JSON-LD schema for BlogPosting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: typeof post.authorId === 'object' && post.authorId?.name ? post.authorId.name : "MiniHisab Team",
    },
    publisher: {
      "@type": "Organization",
      name: "MiniHisab",
      logo: {
        "@type": "ImageObject",
        url: "https://minihisab.com/logo.webp"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://minihisab.com/blog/${post.slug}`
    }
  };

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs]) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={APP_ROUTES.BLOG} className="text-sm font-semibold text-primary flex items-center hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </div>

        <article>
          <header className="mb-10 text-center">
            {post.tags && post.tags.length > 0 && (
              <div className="mb-4 flex justify-center gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              )}
              {typeof post.authorId === 'object' && post.authorId?.name && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>By {post.authorId.name}</span>
                </>
              )}
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-12 overflow-hidden rounded-2xl shadow-lg relative w-full aspect-[16/9] bg-muted/20">
              <Image 
                src={post.coverImage.replace(/^https?:\/\/minihisab\.com/, "")} 
                alt={`${post.title} cover image`}
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                className="object-cover"
              />
            </div>
          )}

          <div 
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>
      </div>
    </>
  );
}
