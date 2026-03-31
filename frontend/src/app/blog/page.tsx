"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/layout/Layout";
import { blogAPI } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { AdLeaderboard } from "@/components/seo/AdBanner";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  status: string;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
  categories: { id: string; name: string; slug: string }[];
  _count: { comments: number };
}

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState<any[]>([]);

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await blogAPI.getPosts({ page, category: category || undefined, search: search || undefined, limit: 12 });
      if (res.data) {
        setPosts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    blogAPI.getCategories().then((res) => {
      if (res.data?.data) setCategories(res.data.data);
    });
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white font-playfair">Blog</h1>
              <p className="text-zinc-500 mt-1">Bài viết, chia sẻ và góc nhìn từ cộng đồng</p>
            </div>
            {/* {isAuthenticated && (
              <Link
                href="/blog/write"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Viết bài
              </Link>
            )} */}
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href="/blog"
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${!category ? "bg-primary-500 text-white" : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
              >
                Tất cả
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${category === cat.slug ? "bg-primary-500 text-white" : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                >
                  {cat.name}
                  {cat._count?.posts > 0 && <span className="ml-1 text-zinc-600">({cat._count.posts})</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Ad Banner */}
          <AdLeaderboard />

          {/* Posts grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
                  <div className="h-48 bg-white/[0.04]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded w-full" />
                    <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-zinc-500">Chưa có bài viết nào</p>
              {isAuthenticated && (
                <Link href="/blog/write" className="inline-block mt-4 text-primary-400 hover:text-primary-300 text-sm">
                  Viết bài đầu tiên →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
                >
                  {post.thumbnailUrl ? (
                    <div className="relative h-48 overflow-hidden">
                      <Image src={post.thumbnailUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-500/10 to-cinema-purple/10 flex items-center justify-center">
                      <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    {post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.categories.map((cat) => (
                          <span key={cat.id} className="text-[11px] font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4 text-[12px] text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-[10px] text-primary-400 font-bold">
                            {post.author.name.charAt(0)}
                          </div>
                        )}
                        <span>{post.author.name}</span>
                      </div>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span>{post.viewCount} lượt xem</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/blog?page=${p}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${p === pagination.page
                      ? "bg-primary-500 text-white"
                      : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
