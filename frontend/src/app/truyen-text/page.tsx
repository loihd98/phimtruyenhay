import React from "react";
import { Metadata } from "next";
import Layout from "../../components/layout/Layout";
import StoriesClient from "../stories/StoriesClient";
import StorySidebar from "../../components/layout/StorySidebar";
import { AdLeaderboard } from "../../components/seo/AdBanner";

const API_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

export async function generateMetadata({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
    const genre = searchParams.genre as string;
    const search = searchParams.search as string;

    let title = "Truyện Đọc Online – Kho Truyện Đọc Online Miễn Phí | The Midnight Movie Reel";
    let description =
        "Kho truyện đọc online với nhiều thể loại hấp dẫn như ngôn tình, trinh thám, truyện ma. Đọc miễn phí tại The Midnight Movie Reel.";

    if (genre) {
        title = `Truyện Chữ thể loại ${genre} – The Midnight Movie Reel`;
        description = `Đọc truyện chữ thể loại ${genre} miễn phí tại The Midnight Movie Reel.`;
    }
    if (search) {
        title = `Tìm kiếm truyện chữ: ${search} – The Midnight Movie Reel`;
        description = `Kết quả tìm kiếm truyện chữ cho "${search}".`;
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            locale: "vi_VN",
        },
        alternates: {
            canonical: "/truyen-text",
        },
    };
}

async function fetchInitialData(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    try {
        const params = new URLSearchParams();
        params.set("page", (searchParams.page as string) || "1");
        params.set("limit", "10");
        params.set("type", "TEXT");
        if (searchParams.genre) params.set("genre", searchParams.genre as string);
        if (searchParams.search) params.set("search", searchParams.search as string);
        if (searchParams.sort) params.set("sort", searchParams.sort as string);

        const [storiesRes, genresRes] = await Promise.all([
            fetch(`${API_URL}/stories?${params}`, { next: { revalidate: 300 } }).catch(() => null),
            fetch(`${API_URL}/stories/genres?type=TEXT`, { next: { revalidate: 300 } }).catch(() => null),
        ]);

        const storiesData = storiesRes?.ok ? await storiesRes.json() : null;
        const genresData = genresRes?.ok ? await genresRes.json() : null;

        return {
            stories: storiesData?.data?.data || storiesData?.data || [],
            pagination: storiesData?.data?.pagination || storiesData?.pagination || null,
            genres: genresData?.genres || [],
        };
    } catch {
        return { stories: [], pagination: null, genres: [] };
    }
}

export default async function TruyenTextPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { stories, pagination, genres } = await fetchInitialData(searchParams);

    return (
        <Layout>
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
                <div className="mb-8 hidden sm:block">
                    <div className="inline-flex items-center gap-2 bg-cinema-neon/10 border border-cinema-neon/20 rounded-full px-4 py-1.5 mb-4">
                        <svg className="w-4 h-4 text-cinema-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                        <span className="text-[12px] font-medium text-cinema-neon uppercase tracking-wider">Text Stories</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Truyện Chữ</h1>
                    <p className="text-base text-zinc-500 max-w-xl">Kho truyện đọc online với nhiều thể loại hấp dẫn</p>
                </div>

                {/* Ad Banner */}
                <AdLeaderboard />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <StoriesClient
                            initialStories={stories}
                            initialPagination={pagination}
                            initialGenres={genres}
                            basePath="/truyen-text"
                            lockedType="TEXT"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <StorySidebar flat />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
