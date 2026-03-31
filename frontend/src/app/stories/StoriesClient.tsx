"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StoryCard from "../../components/stories/StoryCard";
import Pagination from "../../components/ui/Pagination";
import { Story } from "../../types";
import apiClient from "@/utils/api";

// Loading component
const StoriesLoading = () => (
  <div className="space-y-8">
    {/* Stories grid skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[3/4] bg-white/[0.04]"></div>
          <div className="p-2">
            <div className="flex gap-1 mb-2">
              <div className="h-4 bg-white/[0.06] rounded w-12"></div>
              <div className="h-4 bg-white/[0.06] rounded w-10"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-white/[0.06] rounded w-12"></div>
              <div className="h-3 bg-white/[0.06] rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

interface StoriesClientProps {
  initialStories?: any[];
  initialPagination?: PaginationData;
  initialGenres?: Array<{ id: string; name: string; slug: string }>;
  basePath?: string;
  lockedType?: "TEXT" | "AUDIO";
}

export default function StoriesClient({
  initialStories,
  initialPagination,
  initialGenres,
  basePath = "/stories",
  lockedType,
}: StoriesClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [stories, setStories] = useState<Story[]>(initialStories || []);
  const [pagination, setPagination] = useState<PaginationData>(
    initialPagination || {
      page: 1,
      pages: 1,
      total: 0,
      limit: 10,
    }
  );
  const [loading, setLoading] = useState(!initialStories);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || ""
  );
  const [selectedType, setSelectedType] = useState<"TEXT" | "AUDIO" | "">(
    lockedType || (searchParams.get("type") as "TEXT" | "AUDIO") || ""
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(
    searchParams.get("genre") || ""
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "createdAt"
  );
  const [genres, setGenres] = useState<
    Array<{ id: string; name: string; slug: string }>
  >(initialGenres || []);

  const currentPage = Number(searchParams.get("page")) || 1;

  // Fetch stories function
  const fetchStories = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: debouncedSearch.trim() ? "24" : "10",
      });

      if (
        selectedType &&
        (selectedType === "TEXT" || selectedType === "AUDIO")
      ) {
        params.append("type", selectedType);
      }

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      if (selectedGenre) {
        params.append("genre", selectedGenre);
      }

      if (sortBy) {
        params.append("sort", sortBy);
      }

      const response = await apiClient.get(`/stories?${params}`);

      setStories(response.data.data || []);
      setPagination(response.data?.pagination);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories([]);
      setPagination({
        total: 0,
        pages: 0,
        page: 1,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stories when URL parameters change
  useEffect(() => {
    fetchStories(currentPage);
  }, [currentPage, selectedType, debouncedSearch, selectedGenre, sortBy]);

  // Debounce searchQuery → debouncedSearch (triggers API call after 400ms pause)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch genres on component mount (skip if SSR provided)
  useEffect(() => {
    if (initialGenres && initialGenres.length > 0) return;
    const fetchGenres = async () => {
      try {
        const response = await apiClient.get("/stories/genres");
        if (response.data) {
          setGenres(response.data.genres || []);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery); // bypass debounce on explicit submit
    updateURL({
      search: searchQuery,
      type: selectedType,
      genre: selectedGenre,
      sort: sortBy,
      page: "1",
    });
  };

  const handleTypeChange = (type: "TEXT" | "AUDIO" | "") => {
    setSelectedType(type);
    updateURL({
      search: searchQuery,
      type,
      genre: selectedGenre,
      sort: sortBy,
      page: "1",
    });
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    updateURL({
      search: searchQuery,
      type: selectedType,
      genre,
      sort: sortBy,
      page: "1",
    });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURL({
      search: searchQuery,
      type: selectedType,
      genre: selectedGenre,
      sort,
      page: "1",
    });
  };

  const handlePageChange = (page: number) => {
    updateURL({
      search: searchQuery,
      type: selectedType,
      genre: selectedGenre,
      sort: sortBy,
      page: page.toString(),
    });
  };

  const updateURL = (params: {
    search?: string;
    type?: string;
    genre?: string;
    sort?: string;
    page?: string;
  }) => {
    const url = new URLSearchParams();

    if (params.search && params.search.trim()) {
      url.set("search", params.search.trim());
    }

    if (params.genre) {
      url.set("genre", params.genre);
    }

    if (params.sort && params.sort !== "createdAt") {
      url.set("sort", params.sort);
    }

    if (params.page && params.page !== "1") {
      url.set("page", params.page);
    }

    // Don't include type in URL when it's locked (implied by page path)
    if (params.type && !lockedType) {
      url.set("type", params.type);
    }

    const queryString = url.toString();
    router.push(`${basePath}${queryString ? `?${queryString}` : ""}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    if (!lockedType) setSelectedType("");
    setSelectedGenre("");
    setSortBy("createdAt");
    router.push(basePath);
  };

  return (
    <div className="space-y-8">
      {/* Filters with animation */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <form onSubmit={handleSearch} className="flex ">
              <input
                type="text"
                placeholder="Tìm kiếm truyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-white/[0.06] rounded-l-xl bg-white/[0.02] text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-r-xl font-medium transition-colors text-sm"
              >
                Tìm
              </button>
            </form>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type Filter - hidden when type is locked by page context */}
            {!lockedType && (
              <div className="sm:block hidden">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Loại truyện
                </label>
                <select
                  value={selectedType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as "TEXT" | "AUDIO" | "")
                  }
                  className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white focus:outline-none focus:border-primary-500/50 text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="TEXT">Truyện chữ</option>
                  <option value="AUDIO">Truyện audio</option>
                </select>
              </div>
            )}

            {/* Genre Filter */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Thể loại
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white focus:outline-none focus:border-primary-500/50 text-sm"
              >
                <option value="">Tất cả thể loại</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="sm:block hidden">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white focus:outline-none focus:border-primary-500/50 text-sm"
              >
                <option value="createdAt">Mới nhất</option>
                <option value="viewCount">Xem nhiều</option>
                <option value="title">Tên A-Z</option>
                <option value="updatedAt">Cập nhật</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className=" items-end sm:flex hidden">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery ||
            selectedType ||
            selectedGenre ||
            sortBy !== "createdAt") && (
              <div className="hidden sm:flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-zinc-500">
                  Bộ lọc:
                </span>
                {searchQuery && (
                  <span className="px-2.5 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-xs">
                    "{searchQuery}"
                  </span>
                )}
                {selectedType && (
                  <span className="px-2.5 py-0.5 bg-cinema-neon/10 text-cinema-neon border border-cinema-neon/20 rounded-full text-xs">
                    {selectedType === "TEXT"
                      ? "Truyện chữ"
                      : "Truyện audio"}
                  </span>
                )}
                {selectedGenre && (
                  <span className="px-2.5 py-0.5 bg-cinema-purple/10 text-cinema-purple border border-cinema-purple/20 rounded-full text-xs">
                    {genres.find((g) => g.slug === selectedGenre)?.name}
                  </span>
                )}
                {sortBy !== "createdAt" && (
                  <span className="px-2.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs">
                    {sortBy === "viewCount"
                      ? "Xem nhiều"
                      : sortBy === "title"
                        ? "Tên A-Z"
                        : "Cập nhật"}
                  </span>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <StoriesLoading />
      ) : stories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {stories.map((story: any, index: number) => (
              <div
                key={story.id}
                className="animate-fade-in-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <StoryCard story={story} variant="card" />
              </div>
            ))}
          </div>
          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            className="animate-slide-up animation-delay-500"
          />
        </>
      ) : (
        <div className="text-center py-12 animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || selectedType
              ? "Không tìm thấy truyện nào"
              : "Chưa có truyện"}
          </h3>
          <p className="text-gray-600  mb-6">
            {searchQuery || selectedType
              ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
              : "Hiện tại chưa có truyện nào trong hệ thống"}
          </p>
          {(searchQuery || selectedType) && (
            <button
              onClick={clearFilters}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover: hover:scale-105"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}
