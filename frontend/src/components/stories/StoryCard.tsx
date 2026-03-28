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

const POPUP_STORAGE_KEY = 'dailyPopupData';
const MAX_DAILY_POPUP_SHOWS = 2;

const getPopupData = () => {
  try {
    const data = localStorage.getItem(POPUP_STORAGE_KEY);
    if (!data) return { date: '', count: 0 };
    const parsed = JSON.parse(data);
    if (parsed.date !== new Date().toDateString()) return { date: new Date().toDateString(), count: 0 };
    return parsed;
  } catch { return { date: new Date().toDateString(), count: 0 }; }
};

const savePopupData = (count: number) => {
  try { localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify({ date: new Date().toDateString(), count })); } catch { }
};
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
    // Navigate to story page (unless disabled - e.g., already on detail page)
    if (!disableNavigation) {
      const basePath = story.type === "AUDIO" ? "/truyen_audio" : "/truyen_text";
      const navUrl = `${basePath}/${story.slug}?from=story-card`;

      // Check if we should show affiliate popup
      const popupData = getPopupData();
      if (popupData.count < MAX_DAILY_POPUP_SHOWS) {
        try {
          const response = await apiClient.get('/affiliate/public/active?limit=10');
          if (response.data?.success && response.data?.data?.length > 0) {
            const link = response.data.data[popupData.count]?.targetUrl || response.data.data[0]?.targetUrl;
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

  const handleAffiliatePopupClose = () => {
    const popupData = getPopupData();
    savePopupData(popupData.count + 1);
    if (affiliatePopupLink) {
      window.open(affiliatePopupLink, '_blank', 'noopener,noreferrer');
    }
    setAffiliatePopupLink(null);
    if (pendingNavUrl) router.push(pendingNavUrl);
  };

  const renderContent = () => {
    switch (variant) {
      case "compact":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div className="flex">
              <div
                className="w-12 h-12 flex-shrink-0 relative cursor-pointer group/thumb"
                onClick={handleCardClick}
              >
                {story.thumbnailUrl ? (
                  <img
                    src={getMediaUrl(story.thumbnailUrl)}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover/thumb:opacity-90 transition-opacity rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded ${story.thumbnailUrl ? "hidden" : ""
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
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs line-clamp-2">
                  {story.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {story.author?.name || "Tác giả không xác định"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs ${story.type === "AUDIO"
                        ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        }`}
                    >
                      {story.type === "AUDIO" ? "🎧 Audio" : "📖 Text"}
                    </span>
                  </div>
                  {showBookmark && (
                    <button
                      onClick={handleBookmark}
                      className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isBookmarked
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div
              className="aspect-video relative overflow-hidden cursor-pointer group/thumb"
              onClick={handleCardClick}
            >
              {story.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${story.thumbnailUrl ? "hidden" : ""
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
                    className="bg-white/90 dark:bg-gray-700/90 hover:bg-white dark:hover:bg-gray-700 rounded-full p-4 transition-all"
                  >
                    <svg
                      className="w-8 h-8 text-blue-600"
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
                <h3 className="font-semibold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                  {story.title}
                </h3>
                {showBookmark && (
                  <button
                    onClick={handleBookmark}
                    className={`p-1 rounded-full transition-all duration-200 ${isBookmarked
                      ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                      : "text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Tác giả: {story.author?.name || "Không xác định"}
              </p>
              {story.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${story.type === "AUDIO"
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      }`}
                  >
                    {story.type === "AUDIO" ? "🎧 Audio" : "📖 Text"}
                  </span>
                  {story._count?.chapters && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {story._count.chapters} chương
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col h-full"
            onClick={handleCardClick}
          >
            {/* Compact thumbnail with title overlay */}
            <div className="relative aspect-[4/4] overflow-hidden">
              {story?.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center ${story?.thumbnailUrl ? "hidden" : ""
                  }`}
              >
                <div className="text-3xl text-white opacity-80">
                  {story?.type === "AUDIO" ? "🎧" : "📖"}
                </div>
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
                    : "bg-blue-500 text-white"
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
                    : "bg-white/90 dark:bg-gray-700/90 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-yellow-500"
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
              <h3 className="text-white pb-2 font-bold line-clamp-2">{story?.title}</h3>
              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-2">
                {story?.genres?.slice(0, 2).map((genre) => (
                  <span
                    key={genre.id}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                  >
                    {genre.name}
                  </span>
                ))}
                {(story?.genres?.length ?? 0) > 2 && (
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                    +{(story?.genres?.length ?? 0) - 2}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div
              className="aspect-video relative overflow-hidden cursor-pointer group/thumb"
              onClick={handleCardClick}
            >
              {story.thumbnailUrl ? (
                <img
                  src={getMediaUrl(story.thumbnailUrl)}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${story.thumbnailUrl ? "hidden" : ""
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
                    ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/70"
                    : "text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-700/90 hover:bg-white dark:hover:bg-gray-700 hover:text-yellow-500"
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
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-2 text-sm">
                {story.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {story.author?.name || "Tác giả không xác định"}
              </p>
              {story.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
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
    affiliatePopup = createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleAffiliatePopupClose}
      >
        <div
          className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* glow background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl -z-10" />

          <div className="relative z-10 text-center">
            <h2 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap text-[clamp(16px,2.5vw,24px)] mb-10">
              Một Click Nhỏ – Tiếp Thêm Động Lực Lớn 💙
            </h2>

            <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug mt-5">
              Sự ủng hộ của bạn giúp tụi mình có thêm động lực tìm và đăng
              những bộ truyện, bộ phim hay mỗi ngày.
            </p>

            <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug mt-6">
              Cảm ơn vì đã ghé thăm và đồng hành cùng tụi mình!
            </p>

            <button
              onClick={handleAffiliatePopupClose}
              className="w-full max-w-[320px] mt-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
            >
              Bấm để tắt
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
