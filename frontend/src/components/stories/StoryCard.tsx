"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Story } from "../../types";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { addBookmark, removeBookmark } from "../../store/slices/bookmarkSlice";
import { openAudioPlayer } from "../../store/slices/uiSlice";
import { AppDispatch } from "../../store";
import { getMediaUrl, formatViewCount } from "../../utils/media";
import Image from "next/image";
import apiClient from "@/utils/api";
import { isShownForItem, markShownForItem, openAffiliateLink } from "@/utils/affiliateCooldown";
interface StoryCardProps {
  story: Story;
  variant?: "default" | "compact" | "featured" | "card";
  showBookmark?: boolean;
  disableNavigation?: boolean; // Add prop to control navigation
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  variant = "default",
  showBookmark = true,
  disableNavigation = false,
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { bookmarks } = useSelector((state: RootState) => state.bookmarks);
  const isVip = useSelector((state: RootState) => state.vip?.isVip ?? false);
  const [affiliatePopupLink, setAffiliatePopupLink] = useState<string | null>(null);
  const [pendingNavUrl, setPendingNavUrl] = useState<string>("");

  const isBookmarked = bookmarks.some(
    (bookmark: any) =>
      bookmark.story?.id === story.id || bookmark.storyId === story.id
  );

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/auth/login";
      return;
    }

    try {
      if (isBookmarked) {
        const bookmark = bookmarks.find(
          (b: any) =>
            b.story?.id === story.id ||
            b.storyId === story.id
        );
        if (bookmark) {
          await dispatch(removeBookmark(bookmark.id));
        }
      } else {
        await dispatch(addBookmark({ storyId: story.id }));
      }
    } catch (error) {
      console.error("Bookmark error:", error);
    }
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (story.type === "AUDIO" && story.chapters && story.chapters.length > 0) {
      const firstChapter = story.chapters[0];
      if (firstChapter.audioUrl) {
        dispatch(
          openAudioPlayer({
            chapterId: firstChapter.id,
            title: firstChapter.title,
            audioUrl: firstChapter.audioUrl,
            storyTitle: story.title,
          })
        );
      }
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    if (!disableNavigation) {
      const basePath = story.type === "AUDIO" ? "/truyen-audio" : "/truyen-text";
      const navUrl = `${basePath}/${story.slug}?from=story-card`;

      // VIP users skip affiliate popup
      if (!isVip && !isShownForItem(story.id)) {
        try {
          const response = await apiClient.get('/affiliate/public/active?limit=10');
          if (response.data?.success && response.data?.data?.length > 0) {
            const link = response.data.data[0]?.targetUrl;
            if (link) {
              setPendingNavUrl(navUrl);
              setAffiliatePopupLink(link);
              return;
            }
          }
        } catch {
          // API failed, navigate directly
        }
      }

      router.push(navUrl);
    }
  };

  const handleAffiliateConfirm = () => {
    markShownForItem(story.id);
    // Navigate to content page first, then open affiliate in background
    // This preserves browser back button and avoids blank bridge tab
    if (pendingNavUrl) router.push(pendingNavUrl);
    setAffiliatePopupLink(null);
    // Delay affiliate open slightly so the navigation takes priority
    if (affiliatePopupLink) {
      setTimeout(() => {
        openAffiliateLink(affiliatePopupLink);
      }, 300);
    }
  };

  const handleAffiliateSkip = () => {
    markShownForItem(story.id); // Mark as shown so it doesn't repeat
    setAffiliatePopupLink(null);
    if (pendingNavUrl) router.push(pendingNavUrl);
  };

  const renderContent = () => {
    switch (variant) {
      case "compact":
        return (
          <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl hover: transition-shadow overflow-hidden">
            <div className="flex">
              <div
                className="w-12 h-12 flex-shrink-0 relative cursor-pointer group/thumb"
                onClick={handleCardClick}
              >
                {story.thumbnailUrl ? (
                  <img
                    src={getMediaUrl(story.thumbnailUrl)}
                    alt={story.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover/thumb:opacity-90 transition-opacity rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`absolute inset-0 bg-white/[0.04] flex items-center justify-center rounded ${story.thumbnailUrl ? "hidden" : ""
                    }`}
                >
                  <div className="text-xl text-gray-400">
                    {story.type === "AUDIO" ? "🎧" : "📖"}
                  </div>
                </div>
              </div>
              <div
                className="flex-1 p-2 cursor-pointer group"
                onClick={handleCardClick}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-400  text-xs line-clamp-2">
                  {story.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {story.author?.name || "Tác giả không xác định"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-xs text-zinc-500">
                    <span
                      className={`px-2 py-1 rounded text-xs ${story.type === "AUDIO"
                        ? "bg-cinema-neon/10 text-cinema-neon"
                        : "bg-primary-500/10 text-primary-400 "
                        }`}
                    >
                      {story.type === "AUDIO" ? "🎧 Audio" : "📖 Text"}
                    </span>
                  </div>
                  {showBookmark && (
                    <button
                      onClick={handleBookmark}
                      className={`p-1 rounded-full hover:bg-white/[0.06]  ${isBookmarked
                        ? "text-yellow-500"
                        : "text-gray-400 hover:text-yellow-500"
                        }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={isBookmarked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "featured":
        return (
          <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl hover: transition-shadow overflow-hidden">
            <div
              className="aspect-video relative overflow-hidden cursor-pointer group/thumb"
              onClick={handleCardClick}
            >
              {story.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-white/[0.04] flex items-center justify-center ${story.thumbnailUrl ? "hidden" : ""
                  }`}
              >
                <div className="text-4xl text-gray-400">
                  {story.type === "AUDIO" ? "🎧" : "📖"}
                </div>
              </div>
              {story.type === "AUDIO" && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <button
                    onClick={handlePlayAudio}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white  rounded-full p-4 transition-all"
                  >
                    <svg
                      className="w-8 h-8 text-primary-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 cursor-pointer group" onClick={handleCardClick}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-base text-gray-900 dark:text-white group-hover:text-primary-400  line-clamp-2">
                  {story.title}
                </h3>
                {showBookmark && (
                  <button
                    onClick={handleBookmark}
                    className={`p-1 rounded-full transition-all duration-200 ${isBookmarked
                      ? "text-yellow-500 bg-yellow-50   "
                      : "text-gray-400 hover:text-yellow-500 hover:bg-white/[0.06] "
                      }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isBookmarked ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={isBookmarked ? 0 : 2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-zinc-500 text-sm mb-3">
                Tác giả: {story.author?.name || "Không xác định"}
              </p>
              {story.description && (
                <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${story.type === "AUDIO"
                      ? "bg-cinema-neon/10 text-cinema-neon"
                      : "bg-primary-500/10 text-primary-400 "
                      }`}
                  >
                    {story.type === "AUDIO" ? "🎧 Audio" : "📖 Text"}
                  </span>
                  {story._count?.chapters && (
                    <span className="text-xs text-zinc-500">
                      {story._count.chapters} chương
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs text-zinc-500">
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>{formatViewCount(story.viewCount)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "card":
        return (
          <div
            key={story?.id}
            className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl-md overflow-hidden hover: transition-all duration-300 group cursor-pointer flex flex-col h-full"
            onClick={handleCardClick}
          >
            {/* Compact thumbnail with title overlay */}
            <div className="relative aspect-[4/4] overflow-hidden">
              {story?.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-[#1a1028] dark:via-[#141420] dark:to-[#0e0e1c] flex flex-col items-center justify-center ${story?.thumbnailUrl ? "hidden" : ""
                  }`}
              >
                {story?.type === "AUDIO" ? (
                  <svg className="w-12 h-12 text-purple-300 dark:text-purple-400/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-primary-300 dark:text-primary-400/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                )}
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium uppercase tracking-wider">{story?.type === "AUDIO" ? "Audio" : "Text"}</span>
              </div>

              {/* Title overlay at bottom */}
              {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                <p className="text-white/80 text-xs mt-1">
                  👤 {story?.author?.name || "Unknown"}
                </p>
              </div> */}

              {/* Type Badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium shadow-sm ${story?.type === "AUDIO"
                    ? "bg-purple-500 text-white"
                    : "bg-primary-500 text-white"
                    }`}
                >
                  {story?.type === "AUDIO" ? "🎧" : "📖"}
                </span>
              </div>

              {/* Bookmark Button */}
              {showBookmark && (
                <button
                  onClick={handleBookmark}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 shadow-sm ${isBookmarked
                    ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                    : "bg-white/10 backdrop-blur-sm text-zinc-500  hover:bg-white  hover:text-yellow-500"
                    }`}
                >
                  <svg
                    className="w-3 h-3"
                    fill={isBookmarked ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isBookmarked ? 0 : 2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Minimal bottom content */}
            <div className="p-2 flex flex-col flex-1">
              <h3 className="text-gray-900 dark:text-white mb-2 font-bold line-clamp-2">{story?.title}</h3>
              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-2">
                {story?.genres?.slice(0, 2).map((genre) => (
                  <span
                    key={genre.id}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.04] text-zinc-500 rounded text-xs"
                  >
                    {genre.name}
                  </span>
                ))}
                {(story?.genres?.length ?? 0) > 2 && (
                  <span className="px-1.5 py-0.5 bg-white/[0.04] text-zinc-500 rounded text-xs">
                    +{(story?.genres?.length ?? 0) - 2}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                <span className="flex items-center">
                  👁️ {formatViewCount(story?.viewCount || 0)}
                </span>
                <span>
                  📅 {new Date(story?.createdAt)?.toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl hover: transition-shadow overflow-hidden">
            <div
              className="aspect-video relative overflow-hidden cursor-pointer group/thumb"
              onClick={handleCardClick}
            >
              {story.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-white/[0.04] flex items-center justify-center ${story.thumbnailUrl ? "hidden" : ""
                  }`}
              >
                <div className="text-4xl text-gray-400">
                  {story.type === "AUDIO" ? "🎧" : "📖"}
                </div>
              </div>
              {story.type === "AUDIO" && (
                <div className="absolute top-2 left-2">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    🎧 Audio
                  </span>
                </div>
              )}

              {showBookmark && (
                <button
                  onClick={handleBookmark}
                  className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-200 ${isBookmarked
                    ? "text-yellow-500 bg-yellow-100   "
                    : "text-zinc-500  bg-white/10 backdrop-blur-sm hover:bg-white  hover:text-yellow-500"
                    }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill={isBookmarked ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isBookmarked ? 0 : 2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="p-3 cursor-pointer group" onClick={handleCardClick}>
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-400  line-clamp-2 mb-2 text-sm">
                {story.title}
              </h3>
              <p className="text-zinc-500 text-sm mb-2">
                {story.author?.name || "Tác giả không xác định"}
              </p>
              {story.description && (
                <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center space-x-2">
                  {story._count?.chapters && (
                    <span>{story._count.chapters} chương</span>
                  )}
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>{formatViewCount(story.viewCount)}</span>
                  </div>
                </div>
                {story.type !== "AUDIO" && (
                  <span className="bg-primary-500/10 text-primary-400  px-2 py-1 rounded">
                    📖
                  </span>
                )}
              </div>
            </div>
          </div>
        );
    }
  };
  let affiliatePopup = null;

  if (affiliatePopupLink && typeof document !== "undefined") {
    const isAudio = story.type === "AUDIO";
    affiliatePopup = createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <div
          className="relative bg-gradient-to-br from-[#16122a] via-[#161625] to-[#0e0e1c] border border-white/[0.10] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cinema-purple/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-cinema-purple to-primary-500" />

          <div className="relative z-10 p-7 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cinema-purple/20 border border-white/[0.08] flex items-center justify-center text-4xl">
              {isAudio ? "🎧" : "📖"}
            </div>

            <h2 className="text-xl font-bold text-white mb-1.5">
              Ủng hộ một chút nhé! 💙
            </h2>
            <p className="text-sm text-primary-400 font-medium mb-3 line-clamp-1">
              {story.title}
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Click vào link ủng hộ giúp chúng mình tiếp tục cập nhật truyện hay mỗi ngày. Cảm ơn bạn rất nhiều! 🙏
            </p>

            <button
              onClick={handleAffiliateConfirm}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-cinema-purple hover:opacity-90 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all duration-200"
            >
              💝 Ủng hộ &amp; Đọc tiếp
            </button>
            <button
              onClick={handleAffiliateSkip}
              className="mt-2.5 w-full py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors rounded-xl"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
  return (
    <>
      {affiliatePopup}
      {renderContent()}
    </>
  );
};

export default StoryCard;
