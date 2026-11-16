"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Globe,
  PenLine,
  Eye,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
  Sparkles,
  Clock,
  FileText,
  Check,
  Copy,
  RefreshCw,
  Search,
  ExternalLink,
  Tag,
  Hash,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/types";
import { blogService } from "@/services/blog.service";
import { useAuth } from "@/components/auth/auth-provider";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";

const Editor = dynamic(() => import("./tinymce-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full flex flex-col items-center justify-center bg-muted/20 border border-border/80 rounded-xl text-xs text-muted-foreground gap-2">
      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
      <span>Loading Rich Text Editor...</span>
    </div>
  ),
});

const SUGGESTED_TAGS = [
  "Retail",
  "Inventory",
  "Billing",
  "POS",
  "GST",
  "Tutorial",
  "Productivity",
  "Updates",
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface BlogEditorProps {
  initialData?: Partial<BlogPost>;
  onSave: (data: Partial<BlogPost>) => Promise<void>;
  isSaving: boolean;
  canPublish?: boolean;
}

export function BlogEditor({
  initialData,
  onSave,
  isSaving,
  canPublish = true,
}: BlogEditorProps) {
  const { token } = useAuth();
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";

  const isEditMode = Boolean(initialData?._id);

  const [activeTab, setActiveTab] = React.useState<"write" | "seo" | "preview">("write");
  const [tagInput, setTagInput] = React.useState("");
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const [form, setForm] = React.useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    coverImage: "",
    noindex: false,
    status: "draft",
    tags: [],
    ...initialData,
  });

  // Re-sync form state when initialData updates (e.g. after fetch)
  React.useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Real-time content telemetry
  const contentStats = React.useMemo(() => {
    const rawHtml = form.content || "";
    const cleanText = rawHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = cleanText.length;
    const readTimeMin = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMin };
  }, [form.content]);

  // SEO Score calculation (0 to 100%)
  const seoChecklist = React.useMemo(() => {
    const titleLength = (form.title || "").trim().length;
    const contentWords = contentStats.words;
    const descLength = (form.seoDescription || form.excerpt || "").trim().length;
    const hasCover = Boolean(form.coverImage);
    const hasSlug = Boolean((form.slug || "").trim());
    const hasTags = Boolean(form.tags && form.tags.length > 0);

    const items = [
      {
        id: "title",
        label: "Title set (20 to 70 characters)",
        passed: titleLength >= 15 && titleLength <= 80,
        weight: 20,
      },
      {
        id: "content",
        label: "Content depth (150+ words)",
        passed: contentWords >= 150,
        weight: 25,
      },
      {
        id: "seoDesc",
        label: "Meta description (50 to 160 characters)",
        passed: descLength >= 40 && descLength <= 165,
        weight: 20,
      },
      {
        id: "cover",
        label: "Featured cover image uploaded",
        passed: hasCover,
        weight: 15,
      },
      {
        id: "slug",
        label: "Clean search URL slug configured",
        passed: hasSlug,
        weight: 10,
      },
      {
        id: "tags",
        label: "Categories or tags assigned",
        passed: hasTags,
        weight: 10,
      },
    ];

    const score = items.reduce((acc, item) => (item.passed ? acc + item.weight : acc), 0);
    return { items, score };
  }, [form.title, form.slug, form.seoDescription, form.excerpt, form.coverImage, form.tags, contentStats.words]);

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      // Auto-sync slug on new posts if user hasn't typed a custom slug
      const shouldSyncSlug = !isEditMode && (!prev.slug || prev.slug === generateSlug(prev.title || ""));
      return {
        ...prev,
        title: newTitle,
        ...(shouldSyncSlug ? { slug: generateSlug(newTitle) } : {}),
      };
    });
  };

  const handleManualSlugSync = () => {
    if (!form.title?.trim()) {
      toast.error("Please enter a title first");
      return;
    }
    const synced = generateSlug(form.title);
    setForm((f) => ({ ...f, slug: synced }));
    toast.success("Slug synced from title");
  };

  const handleAddTag = (rawTag: string) => {
    const cleanTag = rawTag.trim().replace(/^#/, "");
    if (!cleanTag) return;
    if (!form.tags?.includes(cleanTag)) {
      setForm((f) => ({ ...f, tags: [...(f.tags || []), cleanTag] }));
    }
    setTagInput("");
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags?.filter((t) => t !== tag) }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image size must be under 5MB");
      return;
    }

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await blogService.uploadBlogImage(formData, token);
      setForm((f) => ({ ...f, coverImage: res.data.url }));
      toast.success("Cover image uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload cover image"));
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleTinyMceImageUpload = async (blobInfo: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("image", blobInfo.blob(), blobInfo.filename());
        const res = await blogService.uploadBlogImage(formData, token);
        resolve(res.data.url);
      } catch (err) {
        reject(getErrorMessage(err, "Image upload failed"));
      }
    });
  };

  const handleCopyLink = () => {
    if (!form.slug) return;
    const url = `https://minihisab.com/blog/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ── TOP ACTION HEADER BAR (COMPACT, SPACE-EFFICIENT) ──────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back & Title info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={APP_ROUTES.ADMIN_BLOGS}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                title="Back to Blog Articles"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md">
                  {isEditMode ? form.title || "Edit Article" : "New Blog Article"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shrink-0 ${form.status === "published"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${form.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                  />
                  {form.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {form.slug ? `minihisab.com/blog/${form.slug}` : "Draft article pending publishing"}
              </p>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave({ ...form, status: "draft" })}
              disabled={isSaving}
              className="h-7 sm:h-8 gap-1.5 px-2.5 sm:px-3 text-xs font-medium cursor-pointer shadow-2xs hover:bg-accent"
            >
              <Save className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Save Draft</span>
            </Button>

            {canPublish && (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  onSave({
                    ...form,
                    status: form.status === "published" ? "draft" : "published",
                  })
                }
                disabled={isSaving}
                className="h-7 sm:h-8 gap-1.5 px-3 sm:px-3.5 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                {isSaving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : form.status === "published" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>
                  {form.status === "published" ? "Update Post" : "Publish Now"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* ── WORKSPACE TABS BAR (SWITCH VIEWS IN-PLACE WITHOUT JUMPING) ──── */}
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "write"
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                }`}
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Write & Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "seo"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>SEO & Google Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "preview"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Reader Preview</span>
            </button>
          </div>

          {/* Quick Word & Read Time Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 px-2.5 py-1 rounded-md border border-border/60">
            <span>{contentStats.words} words</span>
            <span>•</span>
            <span>{contentStats.readTimeMin} min read</span>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* LEFT WORKSPACE: Content / SEO / Preview (Keeps TinyMCE Mounted) */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* TAB 1: WRITE & EDIT ──────────────────────────────────────────── */}
          <div className={activeTab === "write" ? "space-y-4" : "hidden"}>
            {/* Title & Live Slug Strip */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
              <div>
                <Input
                  required
                  value={form.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Article Headline..."
                  className="text-lg sm:text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-auto py-1"
                />
              </div>

              {/* URL Slug inline strip */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/60 rounded-lg px-2.5 py-1.5 flex-wrap">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground font-mono text-[11px] shrink-0">
                  minihisab.com/blog/
                </span>
                <input
                  value={form.slug || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""),
                    }))
                  }
                  placeholder="url-slug"
                  className="font-mono text-[11px] font-semibold text-primary bg-transparent border-0 outline-none p-0 min-w-0 flex-1 focus:underline"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSlugSync}
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  title="Resync slug from headline"
                >
                  <RefreshCw className="h-2.5 w-2.5 mr-1" />
                  Sync
                </Button>
                {form.slug && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                    title="Copy public URL"
                  >
                    {copiedUrl ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                  </Button>
                )}
              </div>
            </div>

            {/* TinyMCE Rich Editor */}
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              {/* Editor sub-header info */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <PenLine className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                    Article Body
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span>{contentStats.words} words</span>
                  <span>•</span>
                  <span>{contentStats.readTimeMin} min read</span>
                </div>
              </div>

              {/* Editor Frame */}
              <div className="min-h-[520px]">
                <Editor
                  key={isDark ? "dark" : "light"}
                  licenseKey="gpl"
                  value={form.content || ""}
                  onEditorChange={(content) => setForm((f) => ({ ...f, content }))}
                  init={{
                    height: 540,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image media link | code fullscreen",
                    content_style: `body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.7; background-color: transparent !important; color: ${isDark ? "#F4F4F5" : "#09090B"
                      }; } p { margin-bottom: 1em; } h2, h3, h4 { font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }`,
                    images_upload_handler: handleTinyMceImageUpload,
                    branding: false,
                    promotion: false,
                    skin: isDark ? "oxide-dark" : "oxide",
                    content_css: isDark ? "dark" : "default",
                  }}
                />
              </div>
            </div>

            {/* Excerpt / Summary Card */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Excerpt & Summary</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${(form.excerpt?.length || 0) > 200 ? "text-amber-500 font-bold" : "text-muted-foreground"
                    }`}
                >
                  {form.excerpt?.length || 0} / 200 chars
                </span>
              </div>
              <Textarea
                value={form.excerpt || ""}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Write a concise 1 to 2 sentence summary for blog cards, social links, and search snippets..."
                rows={2}
                className="text-xs bg-muted/20 border-border/80 resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Appears on the blog index cards and serves as the default fallback for search engines.
              </p>
            </div>
          </div>

          {/* TAB 2: SEO & GOOGLE SEARCH PREVIEW ───────────────────────────── */}
          <div className={activeTab === "seo" ? "space-y-4" : "hidden"}>
            {/* Live Google Search Preview Card */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">Google Search Snippet Preview</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">Live Simulation</span>
              </div>

              {/* Realistic Google Search Card */}
              <div className="rounded-lg border border-border/60 bg-background dark:bg-zinc-950 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate font-mono">
                  <span className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                    M
                  </span>
                  <span className="truncate">
                    minihisab.com › blog › {form.slug || "url-slug"}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
                  {form.seoTitle || form.title || "Your Post Headline Here"}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {form.seoDescription ||
                    form.excerpt ||
                    "Enter a compelling meta description to inform readers and maximize click-through rates from search results."}
                </p>
              </div>
            </div>

            {/* SEO Form Fields */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Meta Tags & Search Directives</h3>
              </div>

              {/* SEO Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">SEO Title Tag</label>
                  <span
                    className={`font-mono text-[11px] ${(form.seoTitle?.length || 0) > 60
                        ? "text-amber-500 font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    {form.seoTitle?.length || 0} / 60 chars (recommended)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={form.seoTitle || ""}
                    onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                    placeholder={form.title || "Custom SEO title tag..."}
                    className="text-xs h-9 bg-muted/20 border-border/80"
                  />
                  {form.title && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm((f) => ({ ...f, seoTitle: form.title }))}
                      className="h-9 px-2.5 text-xs shrink-0 cursor-pointer shadow-2xs"
                    >
                      Copy Title
                    </Button>
                  )}
                </div>
              </div>

              {/* SEO Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Meta Description</label>
                  <span
                    className={`font-mono text-[11px] ${(form.seoDescription?.length || 0) > 160
                        ? "text-amber-500 font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    {form.seoDescription?.length || 0} / 160 chars (recommended)
                  </span>
                </div>
                <Textarea
                  value={form.seoDescription || ""}
                  onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                  placeholder={form.excerpt || "Detailed summary for search engines..."}
                  rows={2}
                  className="text-xs bg-muted/20 border-border/80 resize-none"
                />
              </div>

              {/* Canonical URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Canonical URL</label>
                <Input
                  value={form.canonicalUrl || ""}
                  onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
                  placeholder={`https://minihisab.com/blog/${form.slug || ""}`}
                  type="url"
                  className="text-xs h-9 bg-muted/20 border-border/80"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to default to this post's permanent canonical URL.
                </p>
              </div>

              {/* Noindex Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-foreground">
                    Hide from search engines (noindex)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Instructs crawlers (Googlebot, Bingbot) not to index this article in search results.
                  </p>
                </div>
                <Switch
                  checked={Boolean(form.noindex)}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, noindex: checked }))}
                />
              </div>
            </div>
          </div>

          {/* TAB 3: READER PREVIEW ────────────────────────────────────────── */}
          <div className={activeTab === "preview" ? "space-y-4" : "hidden"}>
            <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-2xs">
              {/* Cover Image Banner */}
              {form.coverImage && (
                <div className="w-full aspect-[21/9] rounded-xl overflow-hidden border border-border/60 bg-muted/40">
                  <img
                    src={form.coverImage}
                    alt={form.title || "Cover"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Article Header info */}
              <div className="space-y-3">
                {form.tags && form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {form.title || "Untitled Article"}
                </h1>

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-b border-border/60 pb-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                      A
                    </div>
                    <span className="font-medium text-foreground">Admin Team</span>
                  </div>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{contentStats.readTimeMin} min read</span>
                  <span>•</span>
                  <span>{contentStats.words} words</span>
                </div>
              </div>

              {/* Excerpt callout */}
              {form.excerpt && (
                <p className="text-base sm:text-lg text-muted-foreground font-normal italic border-l-2 border-primary/60 pl-4 py-1">
                  {form.excerpt}
                </p>
              )}

              {/* Formatted Article Body */}
              <div
                className="prose dark:prose-invert max-w-none text-foreground text-sm sm:text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    form.content ||
                    "<p class='text-muted-foreground italic'>Start writing in the editor to see your article preview here...</p>",
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Settings, Cover, Tags, Checklist (Sticky on desktop) */}
        <div className="w-full lg:w-[310px] shrink-0 space-y-3.5 lg:sticky lg:top-4 self-start">
          {/* Card 1: Publication Status & Primary Actions */}


          {/* Card 2: Featured Cover Image */}
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span>Cover Image</span>
              </label>
              {form.coverImage && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                  className="text-[10px] font-semibold text-destructive hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            {form.coverImage ? (
              <div className="relative rounded-lg overflow-hidden border border-border/60 group aspect-[16/9] bg-muted/30">
                <img
                  src={form.coverImage}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold text-black hover:bg-white transition-colors">
                      <Upload className="h-3 w-3" />
                      Replace
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border border-dashed border-border/80 rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors p-4">
                <div className="flex flex-col items-center justify-center text-center">
                  {isUploadingCover ? (
                    <RefreshCw className="w-6 h-6 mb-1 text-primary animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
                  )}
                  <p className="text-xs font-semibold text-foreground mt-1">
                    {isUploadingCover ? "Uploading..." : "Upload Cover Image"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    1200 x 630 px recommended (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                />
              </label>
            )}
          </div>

          {/* Card 3: Tags & Categorization */}
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Tags & Topics</span>
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {form.tags?.length || 0} added
              </span>
            </div>

            {/* Active Tags */}
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 text-[11px] font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add tag input */}
            <div className="relative">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Type tag and press Enter..."
                className="text-xs h-8 bg-muted/20 border-border/80 pr-12"
              />
              {tagInput.trim() && (
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>

            {/* Suggested Tags */}
            <div className="pt-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">
                Suggested Topics
              </p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS.filter((t) => !form.tags?.includes(t)).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleAddTag(st)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    +{st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Article Quality & SEO Readiness */}
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Content Readiness</span>
              <span className="font-mono text-xs font-bold text-primary">
                {seoChecklist.score}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${seoChecklist.score >= 80
                    ? "bg-emerald-500"
                    : seoChecklist.score >= 50
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                style={{ width: `${seoChecklist.score}%` }}
              />
            </div>

            {/* Checklist items */}
            <ul className="space-y-1.5 pt-1 text-[11px]">
              {seoChecklist.items.map((item) => (
                <li key={item.id} className="flex items-center gap-1.5">
                  {item.passed ? (
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-border shrink-0" />
                  )}
                  <span
                    className={
                      item.passed ? "text-foreground font-medium" : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
