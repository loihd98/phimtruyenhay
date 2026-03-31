"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import StorySidebar from "../../components/layout/StorySidebar";
import Layout from "@/components/layout/Layout";

interface Genre {
  id: string;
  name: string;
  slug: string;
  _count: {
    stories: number;
  };
}

interface FilmCategory {
  id: string;
  name: string;
  slug: string;
  _count?: {
    filmReviews?: number;
  };
}

interface GenresClientProps {
  initialGenres: Genre[];
  initialFilmCategories?: FilmCategory[];
}

export default function GenresClient({ initialGenres, initialFilmCategories = [] }: GenresClientProps) {
  const router = useRouter();
  const [genres] = useState<Genre[]>(initialGenres);
  const [filmCategories] = useState<FilmCategory[]>(initialFilmCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [activeTab, setActiveTab] = useState<"stories" | "films">("stories");

  const getGenreDescription = (genreName: string) => {
    const descriptions: { [key: string]: string } = {
      "Tiên Hiệp":
        "Tu tiên, tu chân, tu thần, các câu chuyện về việc tu luyện để trở thành tiên nhân.",
      "Đô Thị":
        "Câu chuyện hiện đại, đời sống thành thị, tình yêu và sự nghiệp trong xã hội hiện tại.",
      "Huyền Huyễn":
        "Thế giới kỳ ảo, phép thuật, ma pháp và những cuộc phiêu lưu không tưởng.",
      "Kiếm Hiệp":
        "Võ lâm, giang hồ, kiếm pháp và những câu chuyện anh hùng hào kiệt.",
      "Ngôn Tình":
        "Tình yêu lãng mạn, câu chuyện tình cảm ngọt ngào và cảm động.",
      "Quan Trường":
        "Chính trị, quyền lực, đấu tranh trong triều đình và quan trường.",
      "Lịch Sử":
        "Dựa trên sự kiện lịch sử, nhân vật lịch sử và bối cảnh thời đại xưa.",
      "Khoa Huyễn":
        "Tương lai, công nghệ, vũ trụ và những câu chuyện viễn tưởng.",
      "Trinh Thám": "Phá án, điều tra, bí ẩn và những câu chuyện hồi hộp.",
      "Võng Du": "Game online, thế giới ảo và những cuộc phiêu lưu trong game.",
    };
    return (
      descriptions[genreName] ||
      "Khám phá những câu chuyện thú vị trong thể loại này."
    );
  };

  const filteredAndSortedGenres = genres
    .filter((genre) =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi");
      } else {
        return b._count.stories - a._count.stories;
      }
    });

  const filteredFilmCategories = filmCategories
    .filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi");
      } else {
        return (b._count?.filmReviews || 0) - (a._count?.filmReviews || 0);
      }
    });

  const popularGenres = [...genres]
    .sort((a, b) => b._count.stories - a._count.stories)
    .slice(0, 8);

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
          <div className="">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Header */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
                  <h1 className="text-2xl font-bold text-white mb-3">
                    Thể Loại Truyện & Phim
                  </h1>
                  <p className="text-zinc-500 text-sm mb-5">
                    Khám phá {genres.length} thể loại truyện {filmCategories.length > 0 ? `và ${filmCategories.length} thể loại phim` : ""}
                  </p>

                  {/* Tab Switcher */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab("stories")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "stories" ? "bg-primary-500 text-white" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}
                    >
                      📖 Truyện ({genres.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("films")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "films" ? "bg-primary-500 text-white" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}
                    >
                      🎬 Phim ({filmCategories.length})
                    </button>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Tìm kiếm thể loại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 text-sm"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as "name" | "count")
                      }
                      className="px-4 py-2.5 border border-white/[0.06] rounded-xl bg-white/[0.02] text-white focus:outline-none focus:border-primary-500/50 text-sm"
                    >
                      <option value="name">Sắp xếp theo tên</option>
                      <option value="count">Sắp xếp theo số lượng</option>
                    </select>
                  </div>
                </div>

                {/* Genres Grid */}
                {activeTab === "stories" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {filteredAndSortedGenres.map((genre, index) => (
                    <div
                      key={genre.id}
                      onClick={() =>
                        router.push(`/the-loai/${genre.slug}`)
                      }
                      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-all duration-300 p-5 cursor-pointer group hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 group-hover:bg-primary-400 transition-colors"></div>
                          <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors">
                            {genre.name}
                          </h3>
                        </div>
                        <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs px-2 py-0.5 rounded-full">
                          {genre._count.stories}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed">
                        {getGenreDescription(genre.name)}
                      </p>
                    </div>
                  ))}
                </div>
                )}

                {/* Film Categories Grid */}
                {activeTab === "films" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {filteredFilmCategories.length > 0 ? filteredFilmCategories.map((cat, index) => (
                    <div
                      key={cat.id}
                      onClick={() => router.push(`/phim?category=${cat.slug}`)}
                      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-primary-500/30 transition-all duration-300 p-5 cursor-pointer group hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-accent-400 rounded-full mr-3 group-hover:bg-accent-300 transition-colors"></div>
                          <h3 className="text-base font-semibold text-white group-hover:text-accent-400 transition-colors">
                            {cat.name}
                          </h3>
                        </div>
                        {cat._count?.filmReviews !== undefined && (
                          <span className="bg-accent-500/10 text-accent-400 border border-accent-500/20 text-xs px-2 py-0.5 rounded-full">
                            {cat._count.filmReviews}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-sm">Khám phá các bộ phim thể loại {cat.name}</p>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-12 text-zinc-500">
                      <p>Chưa có thể loại phim nào{searchTerm ? ` phù hợp với "${searchTerm}"` : ""}</p>
                    </div>
                  )}
                </div>
                )}

                {/* No Results */}
                {activeTab === "stories" && filteredAndSortedGenres.length === 0 && searchTerm && (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h3 className="text-base font-medium text-white mb-2">
                      Không tìm thấy thể loại
                    </h3>
                    <p className="text-zinc-500 text-sm">
                      Không có thể loại nào phù hợp với &quot;{searchTerm}&quot;
                    </p>
                  </div>
                )}

                {/* Popular Genres */}
                {popularGenres.length > 0 && !searchTerm && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 text-center">
                      Thể Loại Phổ Biến
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularGenres.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() =>
                            router.push(`/the-loai/${genre.slug}`)
                          }
                          className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-full hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] transition-all text-sm"
                        >
                          {genre.name} ({genre._count.stories})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                {!searchTerm && (
                  <div className="mt-8 text-center bg-gradient-to-r from-primary-500/10 to-cinema-purple/10 border border-primary-500/20 rounded-2xl p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                      Không tìm thấy thể loại yêu thích?
                    </h2>
                    <p className="text-zinc-400 mb-6 text-sm">
                      Khám phá tất cả các truyện trong kho tàng của chúng
                      tôi
                    </p>
                    <button
                      onClick={() => router.push("/truyen-text")}
                      className="inline-block bg-primary-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-600 transition-colors text-sm"
                    >
                      Xem Tất Cả Truyện
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <StorySidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
