import React from "react";
import { Metadata } from "next";
import Layout from "../../components/layout/Layout";
import StoriesClient from "../stories/StoriesClient";
import StorySidebar from "../../components/layout/StorySidebar";

const API_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

export async function generateMetadata({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
    const genre = searchParams.genre as string;
    const search = searchParams.search as string;

    let title = "Truyện Audio Online – Nghe Truyện Audio Miễn Phí | vivutruyenhay.com";
    let description =
        "Nghe truyện audio hay nhất gồm truyện ma, trinh thám, ngôn tình, truyện người lớn và nhiều thể loại hấp dẫn. Nghe miễn phí tại vivutruyenhay.com.";

    if (genre) {
        title = `Truyện Audio thể loại ${genre} – vivutruyenhay.com`;
        description = `Nghe truyện audio thể loại ${genre} miễn phí tại Kho Truyện Hay.`;
    }
    if (search) {
        title = `Tìm kiếm truyện audio: ${search} – vivutruyenhay.com`;
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
            canonical: "/truyen_audio",
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
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8 animate-fade-in hidden sm:block">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 animate-slide-up">
                        🎧 Truyện Audio
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 animate-slide-up animation-delay-200">
                        Nghe truyện audio hay nhất gồm truyện ma, trinh thám, ngôn tình và nhiều thể loại hấp dẫn
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <StoriesClient
                            initialStories={stories}
                            initialPagination={pagination}
                            initialGenres={genres}
                            basePath="/truyen_audio"
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
