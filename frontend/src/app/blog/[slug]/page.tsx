"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/layout/Layout";
import { blogAPI } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { AdInArticle } from "@/components/seo/AdBanner";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatar: string | null };
  categories: { id: string; name: string; slug: string }[];
  _count: { comments: number };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  replies: Comment[];
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    blogAPI.getPost(slug).then((res) => {
      if (res.data?.data) setPost(res.data.data);
      setIsLoading(false);
    });
    blogAPI.getComments(slug).then((res) => {
      if (res.data?.data) setComments(res.data.data);
    });
  }, [slug]);

  const handleComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await blogAPI.createComment(slug, commentText.trim());
      if (res.data?.data) {
        setComments((prev) => [res.data.data, ...prev]);
        setCommentText("");
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  }, [slug, commentText, isSubmitting]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen py-12">
          <div className="max-w-3xl mx-auto px-4 animate-pulse space-y-6">
            <div className="h-8 bg-white/[0.06] rounded w-3/4" />
            <div className="h-4 bg-white/[0.04] rounded w-1/2" />
            <div className="h-64 bg-white/[0.04] rounded-2xl" />
            <div className="space-y-3">
              <div className="h-3 bg-white/[0.04] rounded" />
              <div className="h-3 bg-white/[0.04] rounded w-5/6" />
              <div className="h-3 bg-white/[0.04] rounded w-4/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy bài viết</h2>
            <Link href="/blog" className="text-primary-400 hover:text-primary-300">← Quay lại blog</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-zinc-400 truncate">{post.title}</span>
          </div>

          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className="text-[12px] font-medium text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full hover:bg-primary-500/20 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white font-playfair leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cinema-purple flex items-center justify-center text-white text-sm font-bold">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <span className="text-zinc-300 font-medium">{post.author.name}</span>
            </div>
            <span>·</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>·</span>
            <span>{post.viewCount} lượt xem</span>
          </div>

          {/* Thumbnail */}
          {post.thumbnailUrl && (
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mt-8">
              <Image src={post.thumbnailUrl} alt={post.title} fill className="object-cover" />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-primary max-w-none mt-8 text-zinc-300 leading-relaxed
              prose-headings:text-white prose-headings:font-bold
              prose-a:text-primary-400 prose-a:no-underline hover:prose-a:text-primary-300
              prose-img:rounded-xl prose-blockquote:border-primary-500/40
              prose-strong:text-white prose-code:text-primary-400 prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.06]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/[0.06]">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="text-[12px] text-zinc-500 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-3 py-1 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Ad Banner */}
          <AdInArticle />

          {/* Comments section */}
          <section className="mt-12 pt-8 border-t border-white/[0.06]">
            <h3 className="text-xl font-bold text-white mb-6">
              Bình luận ({post._count.comments})
            </h3>

            {/* Comment form */}
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center">
                <p className="text-zinc-500 text-sm">
                  <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">Đăng nhập</Link> để bình luận
                </p>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-[11px] text-primary-400 font-bold">
                        {comment.user.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-white">{comment.user.name}</span>
                    <span className="text-[11px] text-zinc-600">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{comment.content}</p>
                  {comment.replies?.length > 0 && (
                    <div className="mt-4 ml-6 space-y-3 border-l-2 border-white/[0.06] pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{reply.user.name}</span>
                            <span className="text-[11px] text-zinc-600">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-sm text-zinc-400">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-zinc-600 text-sm py-8">Chưa có bình luận nào</p>
              )}
            </div>
          </section>
        </div>
      </article>
    </Layout>
  );
}
