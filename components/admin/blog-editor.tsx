"use client";

import * as React from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/types";
import { blogService } from "@/services/blog.service";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { Image as ImageIcon, Save, CheckCircle, Globe } from "lucide-react";

import { useTheme } from "next-themes";

interface BlogEditorProps {
  initialData?: Partial<BlogPost>;
  onSave: (data: Partial<BlogPost>) => Promise<void>;
  isSaving: boolean;
  canPublish?: boolean;
}

export function BlogEditor({ initialData, onSave, isSaving, canPublish }: BlogEditorProps) {
  const { token } = useAuth();
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";

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

  const [tagInput, setTagInput] = React.useState("");

  const handleSlugAuto = (title: string) => {
    if (initialData?._id) return; // Don't auto-generate on edit
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm(f => ({ ...f, title, slug }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags?.includes(tagInput.trim())) {
        setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags?.filter(t => t !== tag) }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await blogService.uploadBlogImage(formData, token);
      setForm(f => ({ ...f, coverImage: res.data.url }));
      toast.success("Cover image uploaded!");
    } catch (err) {
      toast.error(getErrorMessage(err));
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
        reject(getErrorMessage(err));
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <Input 
              required 
              value={form.title} 
              onChange={e => handleSlugAuto(e.target.value)} 
              placeholder="Enter blog post title"
              className="text-lg font-medium"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <div className="border rounded-md overflow-hidden" style={{ minHeight: 600 }}>
              <Editor
                key={isDark ? "dark" : "light"} // force remount when theme changes for TinyMCE
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                licenseKey="gpl"
                value={form.content}
                onEditorChange={(content) => setForm(f => ({ ...f, content }))}
                init={{
                  height: 600,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | image media link | help',
                  content_style: `body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:16px; background-color: transparent !important; color: ${isDark ? '#F8F8F8' : '#09090B'}; }`,
                  images_upload_handler: handleTinyMceImageUpload,
                  branding: false,
                  promotion: false,
                  skin: isDark ? "oxide-dark" : "oxide",
                  content_css: isDark ? "dark" : "default",
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Excerpt</label>
            <Textarea 
              value={form.excerpt} 
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary for listings..."
              rows={3}
            />
          </div>
        </div>

        {/* SEO Panel */}
        <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" /> SEO & Meta
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">SEO Title</label>
              <Input 
                value={form.seoTitle} 
                onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                placeholder={form.title || "Custom SEO title..."}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">SEO Description</label>
              <Textarea 
                value={form.seoDescription} 
                onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                placeholder={form.excerpt || "Custom meta description..."}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Canonical URL</label>
              <Input 
                value={form.canonicalUrl} 
                onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                placeholder="https://minihisab.com/blog/..."
                type="url"
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-lg mt-2">
              <div>
                <p className="text-sm font-medium">Hide from search engines</p>
                <p className="text-xs text-muted-foreground">Add noindex meta tag</p>
              </div>
              <Switch 
                checked={form.noindex} 
                onCheckedChange={checked => setForm(f => ({ ...f, noindex: checked }))} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {/* Publish Actions */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Publish</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={form.status === "published" ? "soft" : "secondary"} className="capitalize">
              {form.status || "Draft"}
            </Badge>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onSave({ ...form, status: "draft" })}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" /> Save as Draft
            </Button>
            
            {canPublish && (
              <Button 
                variant={form.status === "published" ? "secondary" : "default"}
                className={`w-full justify-start ${form.status !== "published" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                onClick={() => onSave({ ...form, status: form.status === "published" ? "draft" : "published" })}
                disabled={isSaving}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> 
                {form.status === "published" ? "Unpublish" : "Publish Now"}
              </Button>
            )}
          </div>
        </div>

        {/* Post Settings */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Settings</h3>
          <div>
            <label className="text-sm font-medium mb-1 block">URL Slug *</label>
            <Input 
              required 
              value={form.slug} 
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") }))} 
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cover Image</label>
            {form.coverImage ? (
              <div className="relative rounded-lg overflow-hidden border mb-2 group">
                <img src={form.coverImage} alt="Cover" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" onClick={() => setForm(f => ({ ...f, coverImage: "" }))}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click to upload cover image</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
              </label>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="px-2 py-1 cursor-pointer hover:bg-destructive/10" onClick={() => handleRemoveTag(tag)}>
                  {tag} &times;
                </Badge>
              ))}
            </div>
            <Input 
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
