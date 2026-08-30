import { apiFetch, getJson, getJsonWithMeta } from "@/lib/api-client";
import { BlogPost, ApiResponse } from "@/lib/types";

export const blogService = {
  // Public APIs
  getPublishedBlogs: async (params?: { page?: number; limit?: number; tag?: string }) => {
    return getJsonWithMeta<{ posts: BlogPost[] }>("/blogs", null, params);
  },
  getPublishedBlogBySlug: async (slug: string) => {
    return getJson<{ post: BlogPost }>(`/blogs/${slug}`, null);
  },

  // Admin APIs
  getAdminBlogs: async (token?: string | null, params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    return getJsonWithMeta<{ posts: BlogPost[] }>("/admin/blogs", token, params);
  },
  getAdminBlogById: async (id: string, token?: string | null) => {
    return getJson<{ post: BlogPost }>(`/admin/blogs/${id}`, token);
  },
  createBlog: async (data: Partial<BlogPost>, token?: string | null) => {
    return apiFetch<ApiResponse<{ post: BlogPost }>>("/admin/blogs", { method: "POST", body: data, token });
  },
  updateBlog: async (id: string, data: Partial<BlogPost>, token?: string | null) => {
    return apiFetch<ApiResponse<{ post: BlogPost }>>(`/admin/blogs/${id}`, { method: "PATCH", body: data, token });
  },
  publishBlog: async (id: string, token?: string | null) => {
    return apiFetch<ApiResponse<{ post: BlogPost }>>(`/admin/blogs/${id}/publish`, { method: "POST", token });
  },
  unpublishBlog: async (id: string, token?: string | null) => {
    return apiFetch<ApiResponse<{ post: BlogPost }>>(`/admin/blogs/${id}/unpublish`, { method: "POST", token });
  },
  deleteBlog: async (id: string, token?: string | null) => {
    return apiFetch(`/admin/blogs/${id}`, { method: "DELETE", token });
  },
  uploadBlogImage: async (formData: FormData, token?: string | null) => {
    // Axios automatically handles the multipart/form-data boundaries when passed a FormData object
    return apiFetch<ApiResponse<{ url: string }>>("/admin/blogs/upload", { method: "POST", body: formData, token });
  }
};
