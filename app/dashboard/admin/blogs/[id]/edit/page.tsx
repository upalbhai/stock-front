"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { BlogEditor } from "@/components/admin/blog-editor";
import { useAuth } from "@/components/auth/auth-provider";
import { blogService } from "@/services/blog.service";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { BlogPost } from "@/lib/types";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, hasPermission } = useAuth();
  const qc = useQueryClient();
  const canPublish = hasPermission("blogs", "publish");

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["admin-blog", params.id],
    queryFn: async () => {
      // Gap #6: Use the dedicated single-post endpoint instead of limit:1000
      const res = await blogService.getAdminBlogById(params.id, token);
      if (!res.post) throw new Error("Blog post not found");
      return res.post;
    },
    enabled: Boolean(token && params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BlogPost>) => blogService.updateBlog(params.id, data, token),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      qc.setQueryData(["admin-blogs", params.id], res.data.post);
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const handleSave = async (formData: Partial<BlogPost>) => {
    try {
      const newStatus = formData.status;
      const statusChanged = initialData && newStatus !== initialData.status;
      
      const { status, ...updateData } = formData;
      await updateMutation.mutateAsync(updateData);
      
      if (statusChanged) {
        if (newStatus === "published") {
          await blogService.publishBlog(params.id, token);
        } else if (newStatus === "draft") {
          await blogService.unpublishBlog(params.id, token);
        }
      }
      
      toast.success("Blog post saved!");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading article...</span>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-xs font-semibold text-destructive">Blog article not found</p>
        <Link href={APP_ROUTES.ADMIN_BLOGS}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Articles</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <BlogEditor 
        initialData={initialData}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
        canPublish={canPublish}
      />
    </div>
  );
}
