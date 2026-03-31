"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { getMediaUrl, formatViewCount } from "../../../utils/media";
import apiClient from "../../../utils/api";
import { FilmReview, FilmComment } from "../../../types";
import { AdInArticle } from "../../../components/seo/AdBanner";

interface FilmReviewDetailProps {
  initialData: FilmReview | null;
  slug: string;
}

const FilmReviewDetail: React.FC<FilmReviewDetailProps> = ({
  initialData,
  slug,
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [filmReview, setFilmReview] = useState<FilmReview | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<number>(0); // index into episodes array
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null); // null = all

  // Comments state
  const [comments, setComments] = useState<FilmComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPagination, setCommentPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!initialData) {
      fetchFilmReview();
    }
    fetchComments();
  }, [slug]);

  const fetchFilmReview = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/film-reviews/${slug}`);
      setFilmReview(response.data?.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page = 1) => {
    try {
      setCommentsLoading(true);
      const response = await apiClient.get(
        `/film-reviews/${slug}/comments?page=${page}&limit=10`
      );
      setComments(response.data?.data || []);
      setCommentPagination(
        response.data?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      );
      setCommentPage(page);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      await apiClient.post(`/film-reviews/${slug}/comments`, {
        content: commentContent.trim(),
      });
      setCommentContent("");
      fetchComments(1);
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      await apiClient.post(`/film-reviews/${slug}/comments`, {
        content: replyContent.trim(),
        parentId,
      });
      setReplyContent("");
      setReplyingTo(null);
      fetchComments(commentPage);
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const renderStars = (rating: number) => {
    const stars = Math.round(rating / 2);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-6 h-6 ${star <= stars
                ? "text-yellow-400"
                : "text-zinc-600"
              }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xl font-bold text-gray-800 dark:text-white ml-2">
          {rating.toFixed(1)}/10
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-64 md:h-96 bg-gray-300 bg-white/[0.04] rounded-xl mb-6" />
          <div className="h-8 bg-gray-300 bg-white/[0.04] rounded w-3/4 mb-4" />
          <div className="h-6 bg-gray-300 bg-white/[0.04] rounded w-1/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 bg-white/[0.04] rounded" />
            <div className="h-4 bg-gray-300 bg-white/[0.04] rounded" />
            <div className="h-4 bg-gray-300 bg-white/[0.04] rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !filmReview) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-zinc-400 mb-2">
          Không tìm thấy review phim
        </h1>
        <p className="text-zinc-500 mb-6">
          {error || "Bài review phim không tồn tại hoặc đã bị xóa."}
        </p>
        <Link
          href="/phim"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="max-w-4xl mx-auto">
        <Link
          href="/phim"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Danh sách review phìm
        </Link>
      </div>

      {/* 1. Video embed / Thumbnail */}
      {(() => {
        const hasEpisodes = filmReview.episodes && filmReview.episodes.length > 1;
        const currentVideoUrl = hasEpisodes
          ? filmReview.episodes![activeEpisode]?.videoUrl || filmReview.reviewLink
          : filmReview.reviewLink;
        const youtubeId = getYouTubeId(currentVideoUrl);
        const currentEp = hasEpisodes ? filmReview.episodes![activeEpisode] : null;

        if (isVideoPlaying && youtubeId) {
          return (
            <div className="w-full bg-black mb-0">
              <div style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                  width="100%"
                  height="100%"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={currentEp?.title || filmReview.title}
                  style={{ border: 0, display: "block" }}
                />
              </div>
              {hasEpisodes && currentEp && (
                <div className="bg-zinc-900 px-4 py-2 text-sm text-zinc-400 flex items-center justify-between">
                  <span>Đang xem: <span className="text-white font-medium">Tập {currentEp.episodeNum}</span>{currentEp.title ? ` - ${currentEp.title}` : ""}</span>
                  {currentEp.duration && <span>{currentEp.duration} phút</span>}
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="max-w-4xl mx-auto">
            <div
              className="relative w-full h-64 md:h-[460px] rounded-2xl overflow-hidden mb-6 bg-white/[0.04] cursor-pointer group shadow-2xl"
              onClick={() => {
                if (youtubeId) {
                  setIsVideoPlaying(true);
                } else if (currentVideoUrl) {
                  window.open(currentVideoUrl, "_blank", "noopener,noreferrer");
                }
              }}
              title={youtubeId ? "Nhấn để xem video" : "Nhấn để xem trên YouTube"}
            >
              {filmReview.thumbnailUrl ? (
                <Image
                  src={getMediaUrl(filmReview.thumbnailUrl)}
                  alt={filmReview.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-8xl">
                  🎬
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-300">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl shadow-red-600/50">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {youtubeId && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.59 3.5 12 3.5 12 3.5s-7.59 0-9.38.55a3.02 3.02 0 0 0-2.12 2.14A31.53 31.53 0 0 0 0 12a31.53 31.53 0 0 0 .5 5.81A3.02 3.02 0 0 0 2.62 19.95C4.41 20.5 12 20.5 12 20.5s7.59 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.53 31.53 0 0 0 24 12a31.53 31.53 0 0 0-.5-5.81z" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
                  </svg>
                  YouTube
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="max-w-4xl mx-auto pt-6">
        {/* 2. Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          {filmReview.title}
        </h1>

        {/* 3. Rating + Language Badge */}
        <div className="flex items-center gap-4 mb-6">
          {renderStars(filmReview.rating)}
          {filmReview.language && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              filmReview.language === "VIETSUB" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
              filmReview.language === "THUYET_MINH" ? "bg-green-500/15 text-green-400 border border-green-500/20" :
              filmReview.language === "LONG_TIENG" ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" :
              "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20"
            }`}>
              {filmReview.language === "VIETSUB" ? "Vietsub" :
               filmReview.language === "THUYET_MINH" ? "Thuyết Minh" :
               filmReview.language === "LONG_TIENG" ? "Lồng Tiếng" : "Raw"}
            </span>
          )}
          {filmReview.totalEpisodes && filmReview.totalEpisodes > 1 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-500/15 text-accent-400 border border-accent-500/20">
              {filmReview.totalEpisodes} tập
            </span>
          )}
        </div>

        {/* 3b. Episode List - Switchable with Language Filter */}
        {filmReview.episodes && filmReview.episodes.length > 1 && (() => {
          const allEpisodes = filmReview.episodes!;
          const availableLanguages = Array.from(new Set(allEpisodes.map(ep => ep.language))).filter(Boolean);
          const filteredEpisodes = filterLanguage
            ? allEpisodes.filter(ep => ep.language === filterLanguage)
            : allEpisodes;
          const langLabel = (lang: string) =>
            lang === "VIETSUB" ? "Vietsub" :
            lang === "THUYET_MINH" ? "Thuyết Minh" :
            lang === "LONG_TIENG" ? "Lồng Tiếng" : "Raw";
          const langColor = (lang: string, active: boolean) =>
            active
              ? lang === "VIETSUB" ? "bg-blue-500 text-white border-blue-400"
                : lang === "THUYET_MINH" ? "bg-green-500 text-white border-green-400"
                : lang === "LONG_TIENG" ? "bg-purple-500 text-white border-purple-400"
                : "bg-zinc-500 text-white border-zinc-400"
              : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:bg-white/[0.06]";

          return (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Danh sách tập ({allEpisodes.length} tập)
            </h2>

            {/* Language Filter Tabs */}
            {availableLanguages.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => { setFilterLanguage(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filterLanguage === null
                      ? "bg-primary-500 text-white border-primary-400"
                      : "bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:bg-white/[0.06]"
                  }`}
                >
                  Tất cả ({allEpisodes.length})
                </button>
                {availableLanguages.map((lang) => {
                  const count = allEpisodes.filter(ep => ep.language === lang).length;
                  return (
                    <button
                      key={lang}
                      onClick={() => { setFilterLanguage(lang); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${langColor(lang, filterLanguage === lang)}`}
                    >
                      {langLabel(lang)} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filteredEpisodes.map((ep) => {
                const originalIdx = allEpisodes.findIndex(e => e.id === ep.id);
                return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setActiveEpisode(originalIdx);
                    setIsVideoPlaying(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all group ${
                    originalIdx === activeEpisode
                      ? "bg-primary-500 text-white border border-primary-400 shadow-lg shadow-primary-500/25"
                      : "bg-white/[0.03] border border-white/[0.06] hover:bg-primary-500/10 hover:border-primary-500/30 text-white hover:text-primary-400"
                  }`}
                  title={ep.title || `Tập ${ep.episodeNum}`}
                >
                  <span className={`text-sm font-bold ${originalIdx === activeEpisode ? "text-white" : ""}`}>{ep.episodeNum}</span>
                  {ep.language && (
                    <span className="text-[9px] opacity-70 mt-0.5">
                      {ep.language === "VIETSUB" ? "VS" : ep.language === "THUYET_MINH" ? "TM" : ep.language === "LONG_TIENG" ? "LT" : "Raw"}
                    </span>
                  )}
                  {ep.duration && (
                    <span className="text-[9px] opacity-60">{ep.duration}p</span>
                  )}
                </button>
                );
              })}
            </div>
            {/* Current episode info */}
            {filmReview.episodes![activeEpisode] && (
              <div className="mt-3 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  <span className="text-primary-400 font-semibold">Tập {filmReview.episodes![activeEpisode].episodeNum}</span>
                  {filmReview.episodes![activeEpisode].title && (
                    <span className="ml-2 text-zinc-500">— {filmReview.episodes![activeEpisode].title}</span>
                  )}
                </span>
                <div className="flex items-center gap-3 text-zinc-500">
                  {filmReview.episodes![activeEpisode].duration && (
                    <span className="text-xs">{filmReview.episodes![activeEpisode].duration} phút</span>
                  )}
                  {activeEpisode > 0 && (
                    <button
                      onClick={() => { setActiveEpisode(activeEpisode - 1); setIsVideoPlaying(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs transition-colors"
                    >
                      ← Tập trước
                    </button>
                  )}
                  {activeEpisode < filmReview.episodes!.length - 1 && (
                    <button
                      onClick={() => { setActiveEpisode(activeEpisode + 1); setIsVideoPlaying(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="px-3 py-1 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-xs transition-colors"
                    >
                      Tập tiếp →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* 4. Actors */}
        {filmReview.actors && filmReview.actors.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3">
              🎭 Diễn viên
            </h2>
            <div className="flex flex-wrap gap-3">
              {filmReview.actors.map((actor) => (
                <div
                  key={actor.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all"
                >
                  {actor.avatar ? (
                    <Image
                      src={getMediaUrl(actor.avatar)}
                      alt={actor.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-zinc-400">
                    {actor.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Description */}
        {filmReview.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3">
              📝 Mô tả
            </h2>
            <div className="prose dark:prose-invert max-w-none text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {filmReview.description}
            </div>
          </div>
        )}

        {/* 6. Tags */}
        {filmReview.tags && filmReview.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3">
              🏷️ Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {filmReview.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/phim?tag=${tag}`}
                  className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-full text-sm hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/30 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 7. Categories */}
        {filmReview.categories && filmReview.categories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3">
              📂 Thể loại
            </h2>
            <div className="flex flex-wrap gap-2">
              {filmReview.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/phim?category=${cat.slug}`}
                  className="px-3 py-1 bg-primary-500/10 text-primary-400  rounded-full text-sm hover:bg-primary-500/20 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ad Banner */}
        <AdInArticle />

        {/* 9. Comments Section */}
        <div className="mt-8 pt-8 border-t border-white/[0.06]">
          <h2 className="text-xl font-bold text-white mb-6">
            💬 Bình luận ({commentPagination.total})
          </h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={submitComment} className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                rows={3}
                className="w-full px-4 py-3 border border-white/[0.06] rounded-2xl bg-white/[0.02] text-white placeholder-zinc-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentContent.trim() || submitting}
                  className="px-6 py-2 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Đang gửi..." : "Gửi bình luận"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center">
              <p className="text-zinc-500 mb-2">
                Bạn cần đăng nhập để bình luận
              </p>
              <Link
                href="/auth/login"
                className="text-primary-400 hover:underline font-medium"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-gray-300 bg-white/[0.04] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 bg-white/[0.04] rounded w-1/4" />
                    <div className="h-4 bg-gray-300 bg-white/[0.04] rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {comment.user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          {comment.user?.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm">
                        {comment.content}
                      </p>
                    </div>

                    {/* Reply button */}
                    {isAuthenticated && (
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="text-xs text-primary-400 hover:underline mt-1 ml-2"
                      >
                        Trả lời
                      </button>
                    )}

                    {/* Reply form */}
                    {replyingTo === comment.id && (
                      <div className="mt-2 ml-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Viết trả lời..."
                          rows={2}
                          className="w-full px-3 py-2 border border-white/[0.06] rounded-2xl bg-white/[0.02] text-white text-sm focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => submitReply(comment.id)}
                            disabled={!replyContent.trim() || submitting}
                            className="px-4 py-1 bg-primary-500 text-white text-sm rounded-2xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                          >
                            Gửi
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="px-4 py-1 text-zinc-500 text-sm hover:text-gray-900  transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className="flex-shrink-0">
                              {reply.user?.avatar ? (
                                <Image
                                  src={reply.user.avatar}
                                  alt={reply.user.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                  {reply.user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 bg-white/[0.03] border border-white/[0.04] rounded-2xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white text-xs">
                                  {reply.user?.name}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-sm">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Comments pagination */}
              {commentPagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from(
                    { length: commentPagination.pages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchComments(page)}
                      className={`w-8 h-8 rounded-full text-sm ${commentPage === page
                          ? "bg-primary-500 text-white"
                          : "bg-gray-200 bg-white/[0.04] text-zinc-400 hover:bg-gray-300 "
                        } transition-colors`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 10. Review Link */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-primary-500/20">
          <h2 className="text-lg font-bold text-white mb-2">
            🔗 Link Review Phim
          </h2>
          <a
            href={filmReview.reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors font-medium"
          >
            Xem Review Đầy Đủ
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* 10. Related film reviews */}
        {filmReview.relatedReviews && filmReview.relatedReviews.length > 0 && (
          <div className="mt-10">
          <h2 className="text-lg font-bold text-white mb-5">
              🎬 Phìm cùng thể loại
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filmReview.relatedReviews.map((related) => (
                <Link
                  key={related.id}
                  href={`/phim/${related.slug}`}
                  className="group bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-36 bg-white/[0.04]">
                    {related.thumbnailUrl ? (
                      <Image
                        src={getMediaUrl(related.thumbnailUrl)}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl">
                        🎬
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-black/70 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-bold">
                      ⭐ {related.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 ">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-500 border-t border-white/[0.06] pt-4">
          <span>
            📅 Đăng ngày:{" "}
            {new Date(filmReview.createdAt).toLocaleDateString("vi-VN")}
          </span>
          <span>👁 Lượt xem: {formatViewCount(filmReview.viewCount)}</span>
          {filmReview.author && <span>✍️ Bởi: {filmReview.author.name}</span>}
        </div>
      </div>
    </div>
  );
};

export default FilmReviewDetail;
