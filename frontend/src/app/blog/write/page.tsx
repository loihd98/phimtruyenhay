"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { blogAPI, mediaAPI } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

export default function BlogWritePage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [tags, setTags] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    blogAPI.getCategories().then((res) => {
      if (res.data?.data) setCategories(res.data.data);
    });
  }, []);

  const handleThumbnailUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await mediaAPI.uploadFile(file, "image");
      if (res.data?.file?.url) {
        setThumbnailUrl(res.data.file.url);
      }
    } catch {
      setError("Upload ảnh thất bại");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !content.trim()) {
      setError("Tiêu đề và nội dung là bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await blogAPI.createPost({
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        status,
      });

      if (res.data?.data) {
        router.push(`/blog/${res.data.data.slug}`);
      } else {
        setError(res.error || "Tạo bài viết thất bại");
      }
    } catch {
      setError("Tạo bài viết thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, excerpt, thumbnailUrl, tags, categoryIds, router]);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (!isReady || !isAuthenticated) return null;

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white mb-8">Viết bài mới</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Tiêu đề *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề bài viết..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-lg font-bold focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Ảnh bìa</label>
              {thumbnailUrl ? (
                <div className="relative h-48 rounded-xl overflow-hidden mb-2">
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setThumbnailUrl("")}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-32 border-2 border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:border-primary-500/30 transition-colors">
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                    </svg>
                    <span className="text-sm text-zinc-500">{isUploading ? "Đang upload..." : "Chọn ảnh bìa"}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Mô tả ngắn</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Mô tả ngắn cho bài viết..."
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Nội dung * (HTML)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết nội dung bài viết... (Hỗ trợ HTML)"
                rows={15}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm font-mono focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-y"
              />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                        categoryIds.includes(cat.id)
                          ? "bg-primary-500 text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] border border-white/[0.06]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Tags (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="phim hay, review, netflix..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isSubmitting ? "Đang xuất bản..." : "Xuất bản"}
              </button>
              <button
                onClick={() => handleSubmit("DRAFT")}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-sm font-medium rounded-xl border border-white/[0.06] transition-all disabled:opacity-50"
              >
                Lưu nháp
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors ml-auto"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
