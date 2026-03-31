import React from "react";
import { Metadata } from "next";
import GenresClient from "../genres/GenresClient";

const API_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

export const metadata: Metadata = {
    title: "Thể Loại Truyện & Phim – The Midnight Movie Reel",
    description:
        "Khám phá tất cả thể loại truyện audio, truyện đọc online và review phim tại The Midnight Movie Reel.",
    keywords: [
        "thể loại truyện",
        "thể loại phim",
        "tiên hiệp",
        "kiếm hiệp",
        "đô thị",
        "ngôn tình",
        "huyền huyễn",
        "truyện audio",
        "đọc truyện online",
        "review phim",
        "The Midnight Movie Reel",
    ],
    openGraph: {
        title: "Thể Loại Truyện & Phim – The Midnight Movie Reel",
        description:
            "Khám phá tất cả thể loại truyện và phim tại The Midnight Movie Reel.",
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
    const [genres, filmCategories] = await Promise.all([
        fetchGenres(),
        fetchFilmCategories(),
    ]);
    return <GenresClient initialGenres={genres} initialFilmCategories={filmCategories} />;
}
