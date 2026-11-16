"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlogEditor } from "@/components/admin/blog-editor";
import { useAuth } from "@/components/auth/auth-provider";
import { blogService } from "@/services/blog.service";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { BlogPost } from "@/lib/types";

export default function NewBlogPage() {
  const router = useRouter();
  const { token, hasPermission } = useAuth();
  const qc = useQueryClient();
  const canPublish = hasPermission("blogs", "publish");

  const createMutation = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      // Gap #1/8: Always create as draft first: backend also enforces this
      const { status, ...draftData } = data;
      const createRes = await blogService.createBlog(draftData, token);
      const postId = createRes.data?.post?._id;

      // If user intended to publish AND has publish permission, call /publish after create
      if (status === "published" && canPublish && postId) {
        await blogService.publishBlog(postId, token);
      }

      return { postId, status };
    },
    onSuccess: ({ postId }) => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog post created successfully!");
      if (postId) {
        router.replace(APP_ROUTES.adminBlogEdit(postId));
      } else {
        router.push(APP_ROUTES.ADMIN_BLOGS);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <BlogEditor 
        onSave={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isSaving={createMutation.isPending}
        canPublish={canPublish}
      />
    </div>
  );
}
