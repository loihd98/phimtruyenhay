"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getMediaUrl, formatViewCount } from "../../utils/media";
import apiClient from "@/utils/api";

interface Story {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl?: string;
  type: "TEXT" | "AUDIO";
  viewCount: number;
  author: {
    name: string;
  };
  genres: Array<{
    name: string;
  }>;
}

interface SidebarProps {
  className?: string;
  flat?: boolean;
}

// Module-level cache so data persists across component mounts (SPA navigations)
let _sidebarCache: { hot: Story[]; trending: Story[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function StorySidebar({ className = "", flat = false }: SidebarProps) {
  const router = useRouter();
  const [hotStories, setHotStories] = useState<Story[]>(_sidebarCache?.hot || []);
  const [trendingStories, setTrendingStories] = useState<Story[]>(_sidebarCache?.trending || []);
  const [loading, setLoading] = useState(!_sidebarCache);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Use cache if fresh
    if (_sidebarCache && Date.now() - _sidebarCache.ts < CACHE_TTL) {
      setHotStories(_sidebarCache.hot);
      setTrendingStories(_sidebarCache.trending);
      setLoading(false);
      return;
    }

    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      setLoading(true);

      const [hotResponse, trendingResponse] = await Promise.all([
        apiClient.get("/stories?sort=viewCount&order=desc&limit=5"),
        apiClient.get("/stories?sort=createdAt&order=desc&limit=5"),
      ]);

      const hot = hotResponse.data?.stories || [];
      const trending = trendingResponse.data?.stories || [];

      setHotStories(hot);
      setTrendingStories(trending);

      // Update module-level cache
      _sidebarCache = { hot, trending, ts: Date.now() };
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const rankColors = [
    "from-yellow-400 to-amber-500",   // #1 gold
    "from-zinc-300 to-zinc-400",      // #2 silver
    "from-amber-600 to-amber-700",    // #3 bronze
  ];

  const StoryItem = ({ story, rank }: { story: Story; rank?: number }) => (
    <div
      onClick={() => router.push(`${story.type === "AUDIO" ? "/truyen-audio" : "/truyen-text"}/${story.slug}?from=sidebar`)}
      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-all duration-200 group"
    >
      {rank !== undefined && (
        <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-br ${rankColors[rank] ?? "from-zinc-600 to-zinc-700"}`}>
          {rank + 1}
        </div>
      )}
      <div className="relative w-10 h-14 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-white/[0.08]">
        {story.thumbnailUrl ? (
          <Image
            src={getMediaUrl(story.thumbnailUrl)}
            alt={story.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
            <span className="text-sm">{story.type === "AUDIO" ? "🎧" : "📖"}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium text-white/90 line-clamp-2 group-hover:text-primary-400 transition-colors leading-tight">
          {story.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
            story.type === "AUDIO" ? "bg-cinema-purple/15 text-cinema-purple" : "bg-primary-500/15 text-primary-400"
          }`}>
            {story.type === "AUDIO" ? "Audio" : "Text"}
          </span>
          <span className="text-[11px] text-zinc-500">👁 {formatViewCount(story.viewCount)}</span>
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
          <div className="w-6 h-6 bg-white/[0.04] rounded-lg flex-shrink-0" />
          <div className="w-10 h-14 bg-white/[0.04] rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/[0.04] rounded w-full" />
            <div className="h-3 bg-white/[0.04] rounded w-3/4" />
            <div className="h-2 bg-white/[0.04] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 🔥 Hot Stories */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center text-base">
            🔥
          </div>
          <h3 className="text-sm font-bold text-white">Truyện Hot</h3>
          <div className="ml-auto h-px flex-1 max-w-[60px] bg-gradient-to-r from-orange-500/30 to-transparent" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <div className="space-y-0.5">
            {hotStories.map((story, index) => (
              <StoryItem key={story.id} story={story} rank={index} />
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/truyen-text?sort=viewCount&order=desc")}
          className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-primary-400 transition-colors py-1"
        >
          Xem tất cả →
        </button>
      </div>

      {/* 📈 Xu hướng */}
      <div className={flat ? "" : "bg-white/[0.02] border border-white/[0.06] rounded-3xl p-4"}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/20 to-cinema-purple/20 border border-primary-500/20 flex items-center justify-center text-base">
            📈
          </div>
          <h3 className="text-sm font-bold text-white">Xu hướng</h3>
          <div className="ml-auto h-px flex-1 max-w-[60px] bg-gradient-to-r from-primary-500/30 to-transparent" />
        </div>

        {loading ? <LoadingSkeleton /> : (
          <div className="space-y-0.5">
            {trendingStories.map((story) => (
              <StoryItem key={story.id} story={story} />
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/truyen-text?sort=createdAt&order=desc")}
          className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-primary-400 transition-colors py-1"
        >
          Truyện mới nhất →
        </button>
      </div>

      {/* ⚡ Quick Links */}
      <div className={flat ? "" : "bg-white/[0.02] border border-white/[0.06] rounded-3xl p-4"}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cinema-neon/20 to-primary-500/20 border border-cinema-neon/20 flex items-center justify-center text-base">
            ⚡
          </div>
          <h3 className="text-sm font-bold text-white">Liên kết nhanh</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Thể loại", emoji: "📚", path: "/the-loai" },
            { label: "Audio", emoji: "🎧", path: "/truyen-audio" },
            { label: "Truyện chữ", emoji: "📖", path: "/truyen-text" },
            { label: "Yêu thích", emoji: "❤️", path: "/bookmarks" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.10] rounded-2xl text-zinc-400 hover:text-white transition-all text-[12px] font-medium"
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
