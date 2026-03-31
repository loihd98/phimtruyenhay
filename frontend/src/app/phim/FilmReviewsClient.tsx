"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMediaUrl, formatViewCount } from "../../utils/media";
import apiClient from "../../utils/api";
import { FilmCategory, FilmReview } from "../../types";
import {
  isAffiliateCooldown,
  markAffiliateShown,
} from "../../utils/affiliateCooldown";
import { AdLeaderboard } from "../../components/seo/AdBanner";

interface FilmReviewsClientProps {
  categories: FilmCategory[];
  tags: string[];
}

const FilmReviewsClient: React.FC<FilmReviewsClientProps> = ({
  categories: ssrCategories,
  tags: ssrTags,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filmReviews, setFilmReviews] = useState<FilmReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FilmCategory[]>(ssrCategories);
  const [tags, setTags] = useState<string[]>(ssrTags);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Affiliate popup state
  const [popupReview, setPopupReview] = useState<FilmReview | null>(null);

  // Fetch categories/tags client-side if SSR failed
  useEffect(() => {
    if (ssrCategories.length === 0) {
      apiClient.get("/film-reviews/categories").then((res) => {
        setCategories(res.data?.data || []);
      }).catch(() => { });
    }
    if (ssrTags.length === 0) {
      apiClient.get("/film-reviews/tags").then((res) => {
        setTags(res.data?.data || []);
      }).catch(() => { });
    }
  }, [ssrCategories, ssrTags]);

  // Filters from URL
  const currentCategory = searchParams.get("category") || "";
  const currentTag = searchParams.get("tag") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const fetchFilmReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "12",
        sort: currentSort,
      };
      if (currentCategory) params.category = currentCategory;
      if (currentTag) params.tag = currentTag;
      if (currentSearch) params.search = currentSearch;

      const response = await apiClient.get("/film-reviews", { params });
      const responseData = response.data;

      setFilmReviews(responseData.data || []);
      setPagination(responseData.pagination || { page: 1, limit: 12, total: 0, pages: 0 });
    } catch (error) {
      console.error("Error fetching film reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentTag, currentSearch, currentSort, currentPage]);

  useEffect(() => {
    fetchFilmReviews();
  }, [fetchFilmReviews]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Only reset page when changing filters, not when navigating pages
    if (key !== "page") {
      params.set("page", "1");
    }
    router.push(`/phim?${params.toString()}`);
  };

  const renderStars = (rating: number) => {
    const stars = Math.round(rating / 2); // Convert 0-10 to 0-5
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= stars ? "text-yellow-400" : "text-zinc-700"
              }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm font-medium text-zinc-500 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                defaultValue={currentSearch}
                placeholder="Tìm phim..."
                className="w-full pl-9 pr-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateFilters("search", (e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Thể loại
            </label>
            <select
              value={currentCategory}
              onChange={(e) => updateFilters("category", e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Tag
            </label>
            <select
              value={currentTag}
              onChange={(e) => updateFilters("tag", e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="">Tất cả tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Sắp xếp
            </label>
            <select
              value={currentSort}
              onChange={(e) => updateFilters("sort", e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="viewCount">Xem nhiều</option>
              <option value="title">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Active filters */}
        {(currentCategory || currentTag || currentSearch) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.06]">
            {currentSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-xs">
                "{currentSearch}"
                <button
                  onClick={() => updateFilters("search", "")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {currentCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cinema-neon/10 text-cinema-neon border border-cinema-neon/20 rounded-full text-xs">
                {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                <button
                  onClick={() => updateFilters("category", "")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {currentTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cinema-purple/10 text-cinema-purple border border-cinema-purple/20 rounded-full text-xs">
                #{currentTag}
                <button
                  onClick={() => updateFilters("tag", "")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => router.push("/phim")}
              className="text-xs text-zinc-500 hover:text-primary-400 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Ad Banner */}
      <AdLeaderboard />

      {/* Film Reviews Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-white/[0.04]" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/[0.06] rounded w-3/4" />
                <div className="h-4 bg-white/[0.06] rounded w-1/2" />
                <div className="h-3 bg-white/[0.06] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filmReviews.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            Chưa có review phim nào
          </h3>
          <p className="text-sm text-zinc-500">
            Hãy quay lại sau để xem các bài review phim mới nhất
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
           xl:grid-cols-4 gap-4 sm:gap-6">
            {filmReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => {
                  if (
                    review.affiliate?.targetUrl &&
                    !isAffiliateCooldown(review.affiliate.targetUrl)
                  ) {
                    setPopupReview(review);
                  } else {
                    router.push(`/phim/${review.slug}`);
                  }
                }}
                className="cursor-pointer group bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-white/[0.04] overflow-hidden">
                  {review.thumbnailUrl ? (
                    <img
                      src={getMediaUrl(review.thumbnailUrl)}
                      alt={review.title}
                      className="max-h-[200px] w-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                    </div>
                  )}
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {review.rating.toFixed(1)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-white text-base mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {review.title}
                  </h3>

                  {/* Stars */}
                  <div className="mb-2">{renderStars(review.rating)}</div>

                  {/* Categories */}
                  {review.categories && review.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat.id}
                          className="text-xs px-2 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {review.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-white/[0.04] text-zinc-500 border border-white/[0.06] rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-white/[0.06] mt-auto">
                    <span>
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {formatViewCount(review.viewCount)}
                      </span>
                      {review._count && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {review._count.comments}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateFilters("page", (currentPage - 1).toString())
                  }
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] hover:text-white transition-colors text-sm"
                >
                  ← Trước
                </button>

                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() =>
                        updateFilters("page", pageNum.toString())
                      }
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${currentPage === pageNum
                        ? "bg-primary-500 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    updateFilters("page", (currentPage + 1).toString())
                  }
                  disabled={currentPage >= pagination.pages}
                  className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] hover:text-white transition-colors text-sm"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ad Banner */}
      <AdLeaderboard />

      {/* Affiliate Popup */}
      {popupReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="relative bg-gradient-to-b from-[#1a1030] to-[#0e0e1c] border border-white/[0.10] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            {/* Thumbnail hero */}
            {popupReview.thumbnailUrl && (
              <div className="relative h-44 w-full">
                <Image
                  src={getMediaUrl(popupReview.thumbnailUrl)}
                  alt={popupReview.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 400px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1c] via-[#0e0e1c]/50 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/40">
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
            )}
            <div className="px-6 pb-6 pt-2 text-center">
              <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-1">Review Phim</p>
              <h3 className="text-base font-bold text-white mb-4 line-clamp-2">{popupReview.title}</h3>
              <button
                onClick={() => {
                  if (popupReview.affiliate?.targetUrl) {
                    markAffiliateShown(popupReview.affiliate.targetUrl);
                    window.open(popupReview.affiliate.targetUrl, "_blank", "noopener,noreferrer");
                  }
                  const slug = popupReview.slug;
                  setPopupReview(null);
                  router.push(`/phim/${slug}`);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-primary-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Xem Phim Ngay
              </button>
              <button
                onClick={() => { const slug = popupReview.slug; setPopupReview(null); router.push(`/phim/${slug}`); }}
                className="mt-2.5 w-full py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
              >
                Xem Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmReviewsClient;
