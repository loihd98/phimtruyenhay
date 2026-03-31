import React from "react";
import { Metadata } from "next";
import GenresClient from "../genres/GenresClient";

const API_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

export const metadata: Metadata = {
    title: "Thể Loại Truyện Audio, Truyện Chữ & Phim – The Midnight Movie Reel",
    description:
        "Khám phá tất cả thể loại truyện audio, truyện chữ online và review phim tại The Midnight Movie Reel. Tiên hiệp, đô thị, kiếm hiệp, ngôn tình, huyền huyễn và nhiều thể loại hấp dẫn khác.",
    keywords: [
        "thể loại truyện audio",
        "thể loại truyện chữ",
        "thể loại phim",
        "tiên hiệp",
        "kiếm hiệp",
        "đô thị",
        "ngôn tình",
        "huyền huyễn",
        "truyện audio hay",
        "đọc truyện online",
        "nghe truyện audio miễn phí",
        "review phim hay",
        "The Midnight Movie Reel",
    ],
    openGraph: {
        title: "Thể Loại Truyện Audio, Truyện Chữ & Phim – The Midnight Movie Reel",
        description:
            "Khám phá tất cả thể loại truyện audio, truyện chữ và phim tại The Midnight Movie Reel.",
        type: "website",
        locale: "vi_VN",
    },
    alternates: {
        canonical: "/the-loai",
    },
};

async function fetchGenres() {
    try {
        const res = await fetch(`${API_URL}/stories/genres`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.genres || [];
    } catch {
        return [];
    }
}

async function fetchAudioGenres() {
    try {
        const res = await fetch(`${API_URL}/stories/genres?type=AUDIO`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.genres || [];
    } catch {
        return [];
    }
}

async function fetchFilmCategories() {
    try {
        const res = await fetch(`${API_URL}/film-reviews/categories`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.categories || data.data || data || [];
    } catch {
        return [];
    }
}

export default async function TheLoaiPage() {
    const [genres, audioGenres, filmCategories] = await Promise.all([
        fetchGenres(),
        fetchAudioGenres(),
        fetchFilmCategories(),
    ]);
    return <GenresClient initialGenres={genres} initialAudioGenres={audioGenres} initialFilmCategories={filmCategories} />;
}
