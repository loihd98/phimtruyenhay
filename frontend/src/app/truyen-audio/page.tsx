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

    let title = "Truyện Audio Online – Nghe Truyện Audio Miễn Phí | The Midnight Movie Reel";
    let description =
        "Nghe truyện audio hay nhất gồm truyện ma, trinh thám, ngôn tình và nhiều thể loại hấp dẫn. Nghe miễn phí tại The Midnight Movie Reel.";

    if (genre) {
        title = `Truyện Audio thể loại ${genre} – The Midnight Movie Reel`;
        description = `Nghe truyện audio thể loại ${genre} miễn phí tại The Midnight Movie Reel.`;
    }
    if (search) {
        title = `Tìm kiếm truyện audio: ${search} – The Midnight Movie Reel`;
        description = `Kết quả tìm kiếm truyện audio cho "${search}".`;
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
            canonical: "/truyen-audio",
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
        params.set("type", "AUDIO");
        if (searchParams.genre) params.set("genre", searchParams.genre as string);
        if (searchParams.search) params.set("search", searchParams.search as string);
        if (searchParams.sort) params.set("sort", searchParams.sort as string);

        const [storiesRes, genresRes] = await Promise.all([
            fetch(`${API_URL}/stories?${params}`, { next: { revalidate: 60 } }).catch(() => null),
            fetch(`${API_URL}/stories/genres?type=AUDIO`, { next: { revalidate: 300 } }).catch(() => null),
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

export default async function TruyenAudioPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { stories, pagination, genres } = await fetchInitialData(searchParams);

    return (
        <Layout>
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
                <div className="mb-8 hidden sm:block">
                    <div className="inline-flex items-center gap-2 bg-cinema-purple/10 border border-cinema-purple/20 rounded-full px-4 py-1.5 mb-4">
                        <svg className="w-4 h-4 text-cinema-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                        <span className="text-[12px] font-medium text-cinema-purple uppercase tracking-wider">Audio Stories</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Truyện Audio</h1>
                    <p className="text-base text-zinc-500 max-w-xl">Nghe truyện audio hay nhất gồm truyện ma, trinh thám, ngôn tình</p>
                </div>

                {/* Ad Banner */}
                <AdLeaderboard />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <StoriesClient
                            initialStories={stories}
                            initialPagination={pagination}
                            initialGenres={genres}
                            basePath="/truyen-audio"
                            lockedType="AUDIO"
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
