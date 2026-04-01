"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import SimpleAudioPlayer from "../../../components/audio/SimpleAudioPlayer";
import { getMediaUrl, formatViewCount } from "../../../utils/media";
import Layout from "@/components/layout/Layout";
import apiClient, { storiesAPI } from "@/utils/api";
import CommentSection from "@/components/comments/CommentSection";
import { useLanguage } from "@/contexts/LanguageContext";
import DailyPopup from "@/components/DailyPopup";
import {
  isAffiliateCooldown,
  markAffiliateShown,
} from "@/utils/affiliateCooldown";

interface Story {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  type: "TEXT" | "AUDIO";
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  viewCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  genres: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  chapters: Array<{
    id: string;
    number: number;
    title: string;
    content?: string;
    audioUrl?: string;
    isLocked: boolean;
    affiliateId?: string;
    affiliate?: {
      id: string;
      provider: string;
      targetUrl: string;
      label?: string;
      isActive: boolean;
    };
    createdAt: string;
  }>;
  affiliate?: {
    id: string;
    provider: string;
    targetUrl: string;
    label?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StoryPageProps {
  params: {
    slug: string;
  };
  initialStory?: Story | null;
}

export default function StoryDetailClient({ params, initialStory }: StoryPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useLanguage();

  const [story, setStory] = useState<Story | null>(initialStory || null);
  const [loading, setLoading] = useState(!initialStory);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  // Capture initial 'from' value so affiliate check works even after URL cleanup
  const initialFrom = useRef(searchParams.get("from"));

  const { slug } = params;

  useEffect(() => {
    if (slug) {
      if (!initialStory) {
        fetchStory();
      }
      fetchTrendingStories();
    }
  }, [slug]);

  // Clean 'from' param from URL on mount (keep URL clean)
  useEffect(() => {
    if (searchParams.get("from")) {
      const cleanParams = new URLSearchParams(searchParams.toString());
      cleanParams.delete("from");
      const qs = cleanParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialFrom.current && story?.affiliate?.targetUrl && !isAffiliateCooldown(story.affiliate.targetUrl)) {
      markAffiliateShown(story.affiliate.targetUrl);
      window.open(story.affiliate.targetUrl, "_blank", "noopener");
    }
  }, [story?.affiliate?.targetUrl]);

  useEffect(() => {
    const chapterFromUrl = Number(searchParams.get("chapter"));
    if (chapterFromUrl && chapterFromUrl > 0) {
      setSelectedChapter(chapterFromUrl);
    } else {
      // No chapter param — set state to 1 without modifying URL
      setSelectedChapter(1);
    }
  }, [searchParams]);

  const updateUrlChapter = (chapterNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("chapter", String(chapterNumber));
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/stories/${slug}`);

      if (!response.data) {
        if (response.status === 404) {
          setError("Truyện không tồn tại");
        } else {
          setError("Có lỗi xảy ra khi tải truyện");
        }
        return;
      }

      setStory(response.data.story);

      // Check if bookmarked
      if (user && response.data.story) {
        checkBookmarkStatus(response.data.story.id);
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      setError("Có lỗi xảy ra khi tải truyện");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (storyId: string) => {
    try {
      const response = await apiClient.get(
        `/bookmarks/check?storyId=${storyId}`
      );

      if (response.data) {
        setIsBookmarked(response.data.isBookmarked);
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const fetchTrendingStories = async () => {
    try {
      setIsLoadingTrending(true);
      const response = await storiesAPI.getStories({
        sort: "viewCount",
        limit: 8,
      });
      setTrendingStories((response.data?.data || []) as Story[]);
    } catch (error) {
      console.error("Error fetching trending stories:", error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const onClickTrendingCard = (story: Story) => {
    // Navigate to story detail without opening affiliate link
    router.push(`/stories/${story.slug}?from=trending`);
  };

  const toggleBookmark = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = isBookmarked
        ? await apiClient.delete("/bookmarks", { data: { storyId: story?.id } })
        : await apiClient.post("/bookmarks", { storyId: story?.id });

      if (response.data) {
        setIsBookmarked(!isBookmarked);
      } else {
        alert("Có lỗi xảy ra khi cập nhật bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Có lỗi xảy ra khi cập nhật bookmark");
    }
  };

  const isAudioStory = story?.type === "AUDIO";

  const currentChapter = story?.chapters.find(
    (c) => c.number === selectedChapter
  );

  const handleChapterChange = (chapterNumber: number) => {
    setSelectedChapter(chapterNumber);
    // Cập nhật URL param
    const params = new URLSearchParams(searchParams.toString());
    params.set("chapter", String(chapterNumber));
    router.push(`${pathname}?${params.toString()}`);
  };

  const onSelectChapter = (chapterNumber: number) => {
    const nextChapter = story?.chapters.find(
      (c) => c.number === chapterNumber
    );

    // If next chapter has an active affiliate link, open it in new tab
    if (nextChapter?.affiliate?.isActive && nextChapter.affiliate.targetUrl) {
      window.open(nextChapter.affiliate.targetUrl, "_blank");
    }
    handleChapterChange(chapterNumber);
  }

  const handleNextChapter = () => {
    if (story && selectedChapter < story.chapters.length) {
      const nextChapterNumber = selectedChapter + 1;
      const nextChapter = story.chapters.find(
        (c) => c.number === nextChapterNumber
      );

      // If next chapter has an active affiliate link, open it in new tab
      if (nextChapter?.affiliate?.isActive && nextChapter.affiliate.targetUrl) {
        window.open(nextChapter.affiliate.targetUrl, "_blank");
      }

      handleChapterChange(nextChapterNumber);
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      handleChapterChange(selectedChapter - 1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto px-4 lg:px-8">
              {/* Loading skeleton */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <div className="w-full aspect-[3/2] bg-white/[0.04] rounded-xl"></div>
                  </div>
                  <div className="lg:col-span-3">
                    <div className="h-8 bg-white/[0.06] rounded mb-4"></div>
                    <div className="h-4 bg-white/[0.06] rounded mb-2"></div>
                    <div className="h-4 bg-white/[0.06] rounded mb-2"></div>
                    <div className="h-4 bg-white/[0.06] rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !story) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {error || "Truyện không tồn tại"}
            </h1>
            <button
              onClick={() => router.push("/stories")}
              className="bg-primary-500 text-white px-6 py-2.5 rounded-xl hover:bg-primary-600 transition-colors text-sm"
            >
              Về trang danh sách truyện
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Daily Popup - only show on mobile and for this story */}
      {story && (
        <DailyPopup
          storyId={story.id}
          affiliateLink={story.affiliate?.targetUrl ? story.affiliate.targetUrl : undefined}
        />
      )}

      <div className="min-h-screen">
        <div className={`max-w-[1400px] mx-auto ${!isAudioStory ? 'px-4 lg:px-8' : ''} py-8`}>
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
            {/* Chapter Content */}
            {isAudioStory && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-5">
                <div className="border-white/[0.06] mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {story.title}
                  </h2>
                </div>

                <div>
                  <Image
                    src={getMediaUrl(story?.thumbnailUrl || "")}
                    alt={story.title}
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl object-contain bg-white/[0.04]"
                  />
                  {currentChapter?.audioUrl ? (
                    <div className="mb-6 mt-4">
                      <SimpleAudioPlayer
                        src={getMediaUrl(currentChapter.audioUrl)}
                        title={`${story.title} - Chương ${currentChapter.number}`}
                      />
                    </div>
                  ) : null}

                  {/* Deal Hot Section */}
                  {story.affiliate?.targetUrl && (
                    <div
                      className="block my-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl"
                    >
                      <p className="font-bold items-center flex-wrap text-center">
                        <span className="text-primary-400 text-sm">Cảm ơn bạn đã ghé thăm Phim Truyện Hay ❤️<br />
                          Nếu bạn thấy những câu chuyện ở đây thú vị, hãy bấm vào đây để ủng hộ tụi mình nhé.
                          Mỗi lượt click của bạn là một nguồn động lực to lớn để tụi mình tiếp tục mang đến nhiều nội dung hay hơn!</span>
                        <a href={story.affiliate.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer" className="underline text-primary-400 hover:text-primary-300 block mt-2 text-sm">Click ủng hộ tại đây</a>
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}
            {/* Story Header */}
            {!isAudioStory && <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Thumbnail */}
                <div className="lg:col-span-1">
                  <div className="w-full rounded-xl overflow-hidden bg-white/[0.04]">
                    {story.thumbnailUrl ? (
                      <Image
                        src={getMediaUrl(story.thumbnailUrl)}
                        alt={story.title}
                        width={600}
                        height={400}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <div className="w-full aspect-[3/2] flex items-center justify-center">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={toggleBookmark}
                      className={`w-full py-2.5 px-4 rounded-xl font-medium transition-colors text-sm ${isBookmarked
                        ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                        : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                        }`}
                    >
                      {isBookmarked ? "\u2764 \u0110\u00e3 y\u00eau th\u00edch" : "Y\u00eau th\u00edch"}
                    </button>

                    {story.affiliate && (
                      <a
                        href={story.affiliate.targetUrl}
                        target="_blank"
                        className="w-full py-2.5 px-4 bg-cinema-neon/10 text-cinema-neon border border-cinema-neon/20 hover:bg-cinema-neon/20 rounded-xl font-medium transition-colors text-center block text-sm"
                      >
                        {story.affiliate.label ||
                          `T\u1ea3i t\u1eeb ${story.affiliate.provider}`}
                      </a>
                    )}
                  </div>
                </div>

                {/* Story Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {story.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {story.author.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {formatViewCount(story.viewCount)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs border ${isAudioStory
                            ? "bg-cinema-purple/10 text-cinema-purple border-cinema-purple/20"
                            : "bg-cinema-neon/10 text-cinema-neon border-cinema-neon/20"
                            }`}
                        >
                          {isAudioStory ? "Audio" : "Text"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="text-zinc-400">
                    <h3 className="text-base font-semibold text-zinc-300 mb-2">M\u00f4 t\u1ea3</h3>
                    <div
                      className={`text-sm ${!showFullDescription ? "line-clamp-4" : ""
                        }`}
                    >
                      {story.description || "Ch\u01b0a c\u00f3 m\u00f4 t\u1ea3"}
                    </div>
                    {story.description && story.description.length > 200 && (
                      <button
                        onClick={() =>
                          setShowFullDescription(!showFullDescription)
                        }
                        className="text-primary-400 hover:text-primary-300 mt-2 text-sm"
                      >
                        {showFullDescription ? "Thu g\u1ecdn" : "Xem th\u00eam"}
                      </button>
                    )}
                  </div>

                  {/* Chapter Statistics */}
                  <div className="mt-6 pt-4 border-t border-white/[0.06]">
                    <div className="text-sm text-zinc-500">
                      {!isAudioStory && `${story.chapters.length} ch\u01b0\u01a1ng \u2022 `}C\u1eadp nh\u1eadt:{" "}
                      {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>}
            {/* Chapter Navigation */}
            {story.chapters.length > 0 && story.type === "TEXT" && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Danh sách chương
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chapter selector */}
                  <div>
                    <select
                      value={selectedChapter}
                      onChange={(e) =>
                        handleChapterChange(Number(e.target.value))
                      }
                      className="w-full p-2.5 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white focus:outline-none focus:border-primary-500/50 text-sm"
                    >
                      {story.chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.number}>
                          Chương {chapter.number}: {chapter.title}
                          {chapter.isLocked && !user ? " 🔒" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevChapter}
                      disabled={selectedChapter <= 1}
                      className="text-sm flex-1 py-2.5 px-4 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-xl hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Chương trước
                    </button>
                    <button
                      onClick={handleNextChapter}
                      disabled={selectedChapter >= story.chapters.length}
                      className="text-sm flex-1 py-2.5 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Chương tiếp →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Content */}
            {currentChapter && story.type === "TEXT" && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="border-b border-white/[0.06] pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Chương {currentChapter.number}: {currentChapter.title}
                  </h2>
                  <div className="text-sm text-zinc-500 mt-2">
                    {new Date(currentChapter.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                </div>

                {currentChapter.isLocked && !user ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Chương này cần đăng nhập
                    </h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      Vui lòng đăng nhập để đọc chương này
                    </p>
                    <button
                      onClick={() => router.push("/auth/login")}
                      className="bg-primary-500 text-white px-6 py-2.5 rounded-xl hover:bg-primary-600 transition-colors text-sm"
                    >
                      Đăng nhập
                    </button>
                  </div>
                ) : (
                  <div>
                    {currentChapter.audioUrl ? (
                      <div className="mb-6">
                        <SimpleAudioPlayer
                          src={getMediaUrl(currentChapter.audioUrl)}
                          title={`${story.title} - Chương ${currentChapter.number}`}
                        />
                      </div>
                    ) : null}

                    {currentChapter.content && (
                      <div className="prose prose-lg prose-invert max-w-none">
                        <div
                          className="text-zinc-300 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: currentChapter.content.replace(
                              /\n/g,
                              "<br />"
                            ),
                          }}
                        />
                      </div>
                    )}

                    {!currentChapter.content && story.type === "TEXT" && (
                      <div className="text-center py-12 text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <p className="text-sm">Nội dung chương đang được cập nhật...</p>
                      </div>
                    )}


                  </div>
                )}

                {/* Chapter Navigation Footer */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.06]">
                  <button
                    onClick={handlePrevChapter}
                    disabled={selectedChapter <= 1}
                    className="flex items-center gap-2 py-2.5 px-4 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-xl hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    ← Chương trước
                  </button>

                  <span className="text-sm text-zinc-500">
                    {selectedChapter} / {story.chapters.length}
                  </span>

                  <button
                    onClick={handleNextChapter}
                    disabled={selectedChapter >= story.chapters.length}
                    className="flex items-center gap-2 py-2.5 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {(() => {
                      const nextChapter = story.chapters.find(
                        (c) => c.number === selectedChapter + 1
                      );
                      return nextChapter?.affiliate?.isActive ? (
                        <>
                          Chương tiếp →
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-1 rounded">
                            📥
                          </span>
                        </>
                      ) : (
                        "Chương tiếp →"
                      );
                    })()}
                  </button>
                </div>
              </div>
            )}

            {/* Trending Stories Section */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mt-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                {t("home.trending")}
              </h3>

              {isLoadingTrending ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex flex-col space-y-2 animate-pulse">
                      <div className="w-full h-48 bg-white/[0.04] rounded-xl"></div>
                      <div className="h-4 bg-white/[0.06] rounded"></div>
                      <div className="h-3 bg-white/[0.06] rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : trendingStories.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingStories.map((trendingStory: Story, index: number) => (
                    <div
                      key={trendingStory.id}
                      onClick={() => onClickTrendingCard(trendingStory)}
                      className="group cursor-pointer"
                    >
                      <div className="relative">
                        {/* Ranking Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <div className="w-7 h-7 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>

                        {/* Thumbnail */}
                        {trendingStory.thumbnailUrl ? (
                          <Image
                            src={getMediaUrl(trendingStory.thumbnailUrl)}
                            alt={trendingStory.title}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover rounded-xl mb-3 group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-48 bg-white/[0.04] rounded-xl mb-3 flex items-center justify-center">
                            <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </div>
                        )}

                        {/* Story Info */}
                        <h4 className="text-sm font-medium text-white group-hover:text-primary-400 line-clamp-2 mb-1">
                          {trendingStory.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mb-2">
                          {trendingStory.author?.name || "Tác giả không xác định"}
                        </p>
                        <div className="flex items-center text-xs text-gray-400">
                          <svg
                            className="w-3 h-3 mr-1"
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
                          {formatViewCount(trendingStory.viewCount || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8 text-sm">
                  Chưa có truyện trending.
                </p>
              )}
            </div>

            {/* Comments Section */}
            {currentChapter && (
              <div className="mt-6">
                <CommentSection
                  chapterId={currentChapter.id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout >
  );
}
