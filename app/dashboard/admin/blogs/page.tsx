"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { blogService } from "@/services/blog.service";
import { useQueryState, parseAsString } from "nuqs";
import {
  Plus,
  PenLine,
  Globe,
  Trash2,
  BookOpen,
  Calendar,
  User,
  RefreshCw,
  CheckCircle2,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/format";

export default function AdminBlogsPage() {
  const { token, hasPermission } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("")
  );
  const [postToDelete, setPostToDelete] = React.useState<any | null>(null);

  const canCreate = hasPermission("blogs", "create");
  const canUpdate = hasPermission("blogs", "update");
  const canDelete = hasPermission("blogs", "delete");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-blogs", search, status],
    queryFn: () =>
      blogService.getAdminBlogs(token, {
        search: search || undefined,
        status: status || undefined,
        limit: 20,
      }),
    enabled: Boolean(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog post deleted successfully");
      setPostToDelete(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const posts = data?.data?.posts || [];
  const totalCount = posts.length;
  const publishedCount = posts.filter(
    (p: any) => p.status === "published"
  ).length;
  const draftCount = posts.filter((p: any) => p.status === "draft").length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Marketing Blog CMS
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                SEO & Content
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Draft, optimize, and publish search articles, release announcements, and product tutorials.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {canCreate && (
              <Link href={APP_ROUTES.ADMIN_BLOG_NEW}>
                <Button
                  size="sm"
                  className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span><span className="hidden sm:inline">New </span>Post</span>
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* All Posts */}
          <button
            type="button"
            onClick={() => setStatus(null)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              !status
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All Articles</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                !status
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Published */}
          <button
            type="button"
            onClick={() => setStatus("published")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              status === "published"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Published Live</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                status === "published"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {publishedCount}
            </span>
          </button>

          {/* Drafts */}
          <button
            type="button"
            onClick={() => setStatus("draft")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              status === "draft"
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileEdit className="h-3.5 w-3.5 text-amber-500" />
            <span>Work in Progress (Drafts)</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                status === "draft"
                  ? "bg-amber-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {draftCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ─────────────────────────────────────────────────── */}
      <DataTable
        isLoading={isLoading}
        data={posts}
        keyExtractor={(p) => p._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search articles..."
        emptyStateText="No blog articles found."
        emptyStateIcon="📝"
        columns={[
          {
            key: "title",
            header: "Article Details",
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">{p.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/60">
                      /{p.slug}
                    </span>
                    {p.noindex && (
                      <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Noindex
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => {
              const isPublished = p.status === "published";
              return (
                <div className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isPublished ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <Badge
                    variant={isPublished ? "soft" : "secondary"}
                    className="capitalize text-[11px] font-medium"
                  >
                    {p.status}
                  </Badge>
                </div>
              );
            },
          },
          {
            key: "author",
            header: "Author",
            render: (p) => (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>
                  {typeof p.authorId === "object" && p.authorId?.name
                    ? p.authorId.name
                    : "Platform Editor"}
                </span>
              </div>
            ),
          },
          {
            key: "date",
            header: "Publication Date",
            render: (p) => (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                <span>
                  {p.publishedAt
                    ? `Published ${formatDate(p.publishedAt)}`
                    : `Updated ${formatDate(p.updatedAt)}`}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (p) => (
              <div className="flex items-center justify-end gap-1.5 pr-2">
                {p.status === "published" && (
                  <Link href={APP_ROUTES.blogPost(p.slug)} target="_blank">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                      title="View live article"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {canUpdate && (
                  <Link href={APP_ROUTES.adminBlogEdit(p._id)}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit article"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setPostToDelete(p)}
                    title="Delete article"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* ── DELETE CONFIRMATION DIALOG ──────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        title="Delete Blog Post"
        message={`Are you sure you want to permanently delete "${postToDelete?.title}"? This will unpublish the article and remove it from search engines.`}
        confirmLabel="Delete Post"
        loading={deleteMutation.isPending}
        variant="danger"
        onConfirm={() => {
          if (postToDelete) {
            deleteMutation.mutate(postToDelete._id);
          }
        }}
      />
    </div>
  );
}
