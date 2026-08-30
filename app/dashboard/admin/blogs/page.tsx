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
import { Plus, PenLine, Globe, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminBlogsPage() {
  const { token, hasPermission } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));

  const canCreate = hasPermission("blogs", "create");
  const canUpdate = hasPermission("blogs", "update");
  const canDelete = hasPermission("blogs", "delete");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-blogs", search, status],
    queryFn: () => blogService.getAdminBlogs(token, { 
      search: search || undefined,
      status: status || undefined,
      limit: 20
    }),
    enabled: Boolean(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog post deleted successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate(id);
    }
  };

  const posts = data?.data?.posts || [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blog CMS</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage marketing and SEO blog posts.</p>
        </div>
        {canCreate && (
          <Link href={APP_ROUTES.ADMIN_BLOG_NEW}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          variant={!status ? "default" : "outline"} 
          size="sm" 
          onClick={() => setStatus(null)}
        >
          All
        </Button>
        <Button 
          variant={status === "published" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setStatus("published")}
        >
          Published
        </Button>
        <Button 
          variant={status === "draft" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setStatus("draft")}
        >
          Drafts
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        data={posts}
        keyExtractor={(p) => p._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search posts..."
        emptyStateText="No blog posts found."
        columns={[
          {
            key: "title", header: "Post",
            render: (p) => (
              <div>
                <p className="font-semibold text-sm">{p.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    /{p.slug}
                  </Badge>
                  {p.noindex && (
                    <Badge variant="secondary" className="text-[10px]">Noindex</Badge>
                  )}
                </div>
              </div>
            )
          },
          {
            key: "status", header: "Status",
            render: (p) => (
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "published" ? "soft" : "secondary"} className="capitalize">
                  {p.status}
                </Badge>
              </div>
            )
          },
          {
            key: "author", header: "Author",
            render: (p) => (
              <span className="text-xs text-muted-foreground">
                {typeof p.authorId === 'object' && p.authorId?.name ? p.authorId.name : "Unknown"}
              </span>
            )
          },
          {
            key: "date", header: "Date",
            render: (p) => (
              <div className="text-xs text-muted-foreground">
                {p.publishedAt ? (
                  <>Published: {new Date(p.publishedAt).toLocaleDateString()}</>
                ) : (
                  <>Updated: {new Date(p.updatedAt).toLocaleDateString()}</>
                )}
              </div>
            )
          },
          {
            key: "actions", header: "",
            render: (p) => (
              <div className="flex items-center justify-end gap-2">
                {p.status === "published" && (
                  <Link href={APP_ROUTES.blogPost(p.slug)} target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Globe className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  </Link>
                )}
                {canUpdate && (
                  <Link href={APP_ROUTES.adminBlogEdit(p._id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <PenLine className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(p._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
