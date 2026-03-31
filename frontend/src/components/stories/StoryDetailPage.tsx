"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";

import { RootState } from "@/store";
import { getMediaUrl, formatViewCount } from "@/utils/media";
import SimpleAudioPlayer from "../audio/SimpleAudioPlayer";
import apiClient from "@/utils/api";
import { isShownForItem, markShownForItem } from "@/utils/affiliateCooldown";

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

const StoryDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [chapterAffiliate, setChapterAffiliate] = useState<{ url: string; nextChapterNum: number } | null>(null);

  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      fetchStory();
    }
  }, [slug]);

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
      if (user) {
        checkBookmarkStatus();
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      setError("Có lỗi xảy ra khi tải truyện");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await apiClient.get(
        `/bookmarks/check?storyId=${story?.id}`
      );

      if (response.data) {
        setIsBookmarked(response.data.isBookmarked);
      }
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await apiClient[isBookmarked ? "delete" : "post"](
        "/bookmarks",
        JSON.stringify({
          storyId: story?.id,
        })
      );

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

  const currentChapter = story?.chapters.find(
    (c) => c.number === selectedChapter
  );

  const handleChapterChange = (chapterNumber: number) => {
    setSelectedChapter(chapterNumber);
  };

  const handleNextChapter = () => {
    if (story && selectedChapter < story.chapters.length) {
      const nextChapterNumber = selectedChapter + 1;
      const nextChapter = story.chapters.find((c) => c.number === nextChapterNumber);

      if (nextChapter?.affiliate?.isActive && nextChapter.affiliate.targetUrl) {
        const itemKey = `${story.id}-ch-${nextChapterNumber}`;
        if (!isShownForItem(itemKey)) {
          // Show popup first, then navigate
          setChapterAffiliate({ url: nextChapter.affiliate.targetUrl, nextChapterNum: nextChapterNumber });
          return;
        }
      }
      setSelectedChapter(nextChapterNumber);
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="h-80 bg-white/[0.03] rounded-3xl animate-pulse" />
          <div className="h-40 bg-white/[0.03] rounded-3xl animate-pulse" />
          <div className="h-64 bg-white/[0.03] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-white mb-3">{error || "Truyện không tồn tại"}</h1>
          <button onClick={() => router.push("/truyen-text")} className="bg-primary-500 text-white px-6 py-2.5 rounded-2xl hover:bg-primary-600 transition-colors">
            Về trang danh sách truyện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Chapter affiliate popup */}
      {chapterAffiliate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="relative bg-gradient-to-br from-[#16122a] via-[#161625] to-[#0e0e1c] border border-white/[0.10] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cinema-purple/15 rounded-full blur-3xl pointer-events-none" />
            <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-cinema-purple to-primary-500" />
            <div className="relative z-10 p-7 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cinema-purple/20 border border-white/[0.08] flex items-center justify-center text-4xl">
                {story.type === "AUDIO" ? "🎧" : "📖"}
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">Ủng hộ để đọc tiếp! 💙</h2>
              <p className="text-sm text-primary-400 font-medium mb-3">Chương {chapterAffiliate.nextChapterNum}</p>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Hãy ghé qua link ủng hộ một chút để giúp chúng mình duy trì website và tiếp tục đăng truyện mỗi ngày! 🙏
              </p>
              <button
                onClick={() => {
                  markShownForItem(`${story.id}-ch-${chapterAffiliate.nextChapterNum}`);
                  window.open(chapterAffiliate.url, "_blank", "noopener,noreferrer");
                  setSelectedChapter(chapterAffiliate.nextChapterNum);
                  setChapterAffiliate(null);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-cinema-purple hover:opacity-90 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all duration-200"
              >
                💝 Ủng hộ &amp; Đọc chương tiếp
              </button>
              <button
                onClick={() => { setSelectedChapter(chapterAffiliate.nextChapterNum); setChapterAffiliate(null); }}
                className="mt-2.5 w-full py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors rounded-xl"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Story Header ── */}
        <div className="relative mb-6 rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          {/* blurred bg */}
          {story.thumbnailUrl && (
            <div className="absolute inset-0">
              <Image src={getMediaUrl(story.thumbnailUrl)} alt="" fill className="object-cover blur-2xl scale-110 opacity-20" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/80 to-[#0a0a0f]" />
            </div>
          )}

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Cover */}
              <div className="flex-shrink-0">
                <div className="w-36 sm:w-44 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  {story.thumbnailUrl ? (
                    <Image src={getMediaUrl(story.thumbnailUrl)} alt={story.title} width={176} height={264} className="w-full h-auto object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-white/[0.04] flex items-center justify-center">
                      <span className="text-5xl">{story.type === "AUDIO" ? "🎧" : "📚"}</span>
                    </div>
                  )}
                </div>
                {/* Action buttons */}
                <div className="mt-3 space-y-2">
                  <button
                    onClick={toggleBookmark}
                    className={`w-full py-2 px-3 rounded-xl font-medium text-sm transition-all ${
                      isBookmarked
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    {isBookmarked ? "❤️ Đã yêu thích" : "🤍 Yêu thích"}
                  </button>
                  {story.affiliate && (
                    <a href={story.affiliate.targetUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-gradient-to-r from-primary-500/20 to-cinema-purple/20 border border-primary-500/30 text-primary-400 hover:text-primary-300 rounded-xl font-medium text-sm transition-all text-center block"
                    >
                      📥 {story.affiliate.label || `Tải từ ${story.affiliate.provider}`}
                    </a>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Type badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                  story.type === "AUDIO" ? "bg-cinema-purple/20 text-cinema-purple border border-cinema-purple/30" : "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                }`}>
                  {story.type === "AUDIO" ? "🎧 Truyện Audio" : "📖 Truyện Chữ"}
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{story.title}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-4">
                  <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{story.author.name}</span>
                  <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{formatViewCount(story.viewCount)} lượt xem</span>
                  <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>{story.chapters.length} chương</span>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {story.genres.map((genre) => (
                    <span key={genre.id} className="px-3 py-1 bg-white/[0.04] text-zinc-400 rounded-xl text-xs border border-white/[0.06] hover:border-primary-500/30 hover:text-primary-400 transition-colors cursor-default">
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="text-zinc-400 text-sm leading-relaxed">
                  <div className={!showFullDescription ? "line-clamp-3" : ""}>
                    {story.description || "Chưa có mô tả"}
                  </div>
                  {story.description && story.description.length > 160 && (
                    <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-primary-400 hover:text-primary-300 mt-1 text-xs font-medium">
                      {showFullDescription ? "Thu gọn ↑" : "Xem thêm ↓"}
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-zinc-500">
                  Cập nhật: {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chapter Navigation ── */}
        {story.chapters.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h8" /></svg>
              <h2 className="text-base font-bold text-white">Danh sách chương</h2>
              <span className="ml-auto text-xs text-zinc-500">{selectedChapter} / {story.chapters.length}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/[0.04] rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-cinema-purple rounded-full transition-all duration-500"
                style={{ width: `${(selectedChapter / story.chapters.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select
                  value={selectedChapter}
                  onChange={(e) => handleChapterChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-white/[0.08] rounded-2xl bg-white/[0.03] text-white text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none"
                >
                  {story.chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.number} className="bg-[#161625]">
                      Chương {chapter.number}: {chapter.title}
                      {chapter.isLocked && !user ? " 🔒" : ""}
                      {chapter.affiliate?.isActive ? " ✨" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  onClick={handlePrevChapter}
                  disabled={selectedChapter <= 1}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white/[0.04] text-zinc-400 rounded-2xl hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium border border-white/[0.06]"
                >
                  ← Trước
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={selectedChapter >= story.chapters.length}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-lg shadow-primary-500/20"
                >
                  Tiếp →{story.chapters.find((c) => c.number === selectedChapter + 1)?.affiliate?.isActive ? " ✨" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Chapter Content ── */}
        {currentChapter && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden">
            {/* Chapter header */}
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h2 className="text-lg font-bold text-white">
                Chương {currentChapter.number}: {currentChapter.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                📅 {new Date(currentChapter.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div className="p-6">
              {currentChapter.isLocked && !user ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-4xl mx-auto mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Chương này cần đăng nhập</h3>
                  <p className="text-zinc-500 text-sm mb-5">Vui lòng đăng nhập để đọc chương này</p>
                  <button onClick={() => router.push("/auth/login")} className="bg-gradient-to-r from-primary-500 to-cinema-purple text-white px-8 py-3 rounded-2xl font-medium shadow-lg shadow-primary-500/25 hover:opacity-90 transition-all">
                    Đăng nhập ngay
                  </button>
                </div>
              ) : (
                <div>
                  {story.type === "AUDIO" && (currentChapter.audioUrl || story.audioUrl) && (
                    <div className="mb-6">
                      <SimpleAudioPlayer
                        src={getMediaUrl(currentChapter.audioUrl || story.audioUrl!)}
                        title={`${story.title} - Chương ${currentChapter.number}`}
                      />
                    </div>
                  )}

                  {currentChapter.content && (
                    <div className="prose prose-invert max-w-none">
                      <div
                        className="text-zinc-300 leading-[1.9] text-[15px] tracking-wide [&>br]:block [&>br]:mb-2"
                        dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, "<br />") }}
                      />
                    </div>
                  )}

                  {!currentChapter.content && story.type === "TEXT" && (
                    <div className="text-center py-16 text-zinc-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>Nội dung chương đang được cập nhật...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer nav */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/[0.06]">
                <button
                  onClick={handlePrevChapter}
                  disabled={selectedChapter <= 1}
                  className="flex items-center gap-2 py-2.5 px-5 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-2xl hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  ← Chương trước
                </button>
                <span className="text-xs text-zinc-600">{selectedChapter} / {story.chapters.length}</span>
                <button
                  onClick={handleNextChapter}
                  disabled={selectedChapter >= story.chapters.length}
                  className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-primary-500/20"
                >
                  Chương tiếp →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
                >
                  Chương tiếp →
                  {story.chapters.find((c) => c.number === selectedChapter + 1)
                    ?.affiliate?.isActive
                    ? " 🔗"
                    : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;
