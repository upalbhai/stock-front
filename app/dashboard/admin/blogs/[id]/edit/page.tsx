"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BlogEditor } from "@/components/admin/blog-editor";
import { useAuth } from "@/components/auth/auth-provider";
import { blogService } from "@/services/blog.service";
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

  if (isLoading) return <div>Loading...</div>;
  if (!initialData) return <div>Not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Blog Post</h1>
        <p className="text-sm text-muted-foreground mt-1">Update SEO marketing post.</p>
      </div>

      <BlogEditor 
        initialData={initialData}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
        canPublish={canPublish}
      />
    </div>
  );
}
