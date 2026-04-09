"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StoryCard from "../stories/StoryCard";
import { getMediaUrl, formatViewCount } from "../../utils/media";
import {
    isAffiliateCooldown,
    markAffiliateShown,
    openAffiliateLink,
} from "../../utils/affiliateCooldown";
import { Story } from "../../types";
import { AdLeaderboard } from "../seo/AdBanner";

interface FilmReview {
    id: string;
    slug: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    rating: number;
    viewCount: number;
    createdAt: string;
    categories?: Array<{ id: string; name: string; slug: string }>;
    affiliate?: { id: string; targetUrl: string; label?: string };
}

interface HomepageContentProps {
    audioStories: Story[];
    filmReviews: FilmReview[];
    textStories: Story[];
    trendingStories: Story[];
    trendingReviews: FilmReview[];
}

/* ─── small helpers ─────────────────────────────────── */
const CardSkeleton = () => (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[3/4] bg-white/[0.04]" />
        <div className="p-3 space-y-2">
            <div className="h-4 bg-white/[0.04] rounded-lg w-3/4" />
            <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
        </div>
    </div>
);

const SectionHeader = ({
    icon,
    title,
    subtitle,
    href,
    accentColor = "primary",
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
    accentColor?: string;
}) => {
    const colorMap: Record<string, string> = {
        primary: "bg-primary-500/10 text-primary-400 border-primary-500/20",
        accent: "bg-accent-500/10 text-accent-400 border-accent-500/20",
        purple: "bg-cinema-purple/10 text-cinema-purple border-cinema-purple/20",
        neon: "bg-cinema-neon/10 text-cinema-neon border-cinema-neon/20",
    };
    const linkColor: Record<string, string> = {
        primary: "text-primary-400 hover:text-primary-300",
        accent: "text-accent-400 hover:text-accent-300",
        purple: "text-purple-400 hover:text-purple-300",
        neon: "text-cyan-400 hover:text-cyan-300",
    };
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[accentColor] || colorMap.primary}`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="text-xs text-zinc-600 hidden sm:block">{subtitle}</p>
                </div>
            </div>
            <Link href={href} className={`flex items-center gap-1 font-medium text-sm transition-colors ${linkColor[accentColor] || linkColor.primary}`}>
                Xem tất cả
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
        </div>
    );
};

/* ─── main component ────────────────────────────────── */
const HomepageContent: React.FC<HomepageContentProps> = ({
    audioStories,
    filmReviews,
    textStories,
    trendingStories,
    trendingReviews,
}) => {
    const router = useRouter();
    const [popupReview, setPopupReview] = useState<FilmReview | null>(null);
    const [heroIndex, setHeroIndex] = useState(0);

    // Hero carousel items – combine trending reviews + stories
    const heroItems = [
        ...filmReviews.slice(0, 3).map((r) => ({ type: "film" as const, id: r.id, title: r.title, description: r.description || "", thumbnail: r.thumbnailUrl, rating: r.rating, slug: r.slug, href: `/phim/${r.slug}` })),
        ...trendingStories.slice(0, 2).map((s) => ({ type: "story" as const, id: s.id, title: s.title, description: (s as any).description || "", thumbnail: s.thumbnailUrl, rating: 0, slug: s.slug, href: `${s.type === "AUDIO" ? "/truyen-audio" : "/truyen-text"}/${s.slug}` })),
    ];

    // Auto-rotate hero carousel
    useEffect(() => {
        if (heroItems.length <= 1) return;
        const timer = setInterval(() => setHeroIndex((i) => (i + 1) % heroItems.length), 5000);
        return () => clearInterval(timer);
    }, [heroItems.length]);

    const handleReviewClick = (review: FilmReview) => {
        if (review.affiliate?.targetUrl && !isAffiliateCooldown(review.affiliate.targetUrl)) {
            setPopupReview(review);
        } else {
            router.push(`/phim/${review.slug}`);
        }
    };

    const renderStars = (rating: number) => {
        const stars = Math.round(rating / 2);
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-3 h-3 ${s <= stars ? "text-accent-400" : "text-zinc-700"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="text-xs text-zinc-500 ml-1">{rating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-14">

            {/* ── Hero Cinema Carousel ── */}
            {heroItems.length > 0 && (
                <section className="relative rounded-3xl overflow-hidden bg-gray-100 dark:bg-[#0a0a14] border border-gray-200 dark:border-white/[0.06]" style={{ minHeight: 340 }}>
                    {/* Default cinematic background pattern when no hero image */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 dark:opacity-100" />
                    {heroItems.map((item, idx) => (
                        <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ${idx === heroIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                            {/* Background image */}
                            {item.thumbnail && (
                                <Image src={getMediaUrl(item.thumbnail)} alt="" fill className="object-cover" sizes="1400px" priority={idx === 0} />
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-100/80 to-transparent dark:from-[#0a0a14] dark:via-[#0a0a14]/80 dark:to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-transparent to-gray-100/40 dark:from-[#0a0a14] dark:via-transparent dark:to-[#0a0a14]/40" />

                            {/* Content */}
                            <div className="relative z-20 h-full flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
                                <span className={`text-xs font-bold uppercase tracking-widest mb-2 ${item.type === "film" ? "text-primary-400" : "text-accent-400"}`}>
                                    {item.type === "film" ? "🎬 Review Phim" : "📖 Truyện Nổi Bật"}
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 line-clamp-2 drop-shadow-lg">{item.title}</h2>
                                {item.description && (
                                    <p className="text-gray-600 dark:text-zinc-300 text-sm sm:text-base line-clamp-2 mb-4">{item.description.replace(/<[^>]*>/g, "").slice(0, 160)}</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <Link href={item.href} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:scale-105">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        {item.type === "film" ? "Xem Review" : "Đọc ngay"}
                                    </Link>
                                    {item.rating > 0 && (
                                        <span className="flex items-center gap-1.5 text-accent-400 font-bold text-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            {item.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Carousel dots */}
                    {heroItems.length > 1 && (
                        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
                            {heroItems.map((_, idx) => (
                                <button key={idx} onClick={() => setHeroIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === heroIndex ? "bg-primary-500 w-6" : "bg-white/30 hover:bg-white/50"}`} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ── Truyện Audio Nổi Bật ── */}
            <section className="animate-fade-up">
                <SectionHeader
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>}
                    title="Truyện Audio Nổi Bật"
                    subtitle="Nghe truyện audio mới nhất mỗi ngày"
                    href="/truyen-audio"
                    accentColor="purple"
                />
                {audioStories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
                        {audioStories.slice(0, 10).map((story) => (
                            <StoryCard key={story.id} story={story} variant="card" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                )}
            </section>

            {/* Ad Banner */}
            <AdLeaderboard />

            {/* ── Film Reviews ── */}
            <section className="animate-fade-up-delay-1">
                <SectionHeader
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>}
                    title="Review Phim Mới Nhất"
                    subtitle="Phân tích chi tiết & không spoiler"
                    href="/phim"
                    accentColor="primary"
                />
                {filmReviews.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
                        {filmReviews.slice(0, 10).map((review) => (
                            <div key={review.id} onClick={() => handleReviewClick(review)} className="cursor-pointer group bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl overflow-hidden hover:border-primary-500/30 hover:bg-primary-500/[0.02] transition-all duration-300 flex flex-col">
                                <div className="relative aspect-[2/3] bg-gray-100 dark:bg-[#0c0c14] overflow-hidden">
                                    {review.thumbnailUrl ? (
                                        <Image src={getMediaUrl(review.thumbnailUrl)} alt={review.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a1028] dark:to-[#0c0c14]"><svg className="w-10 h-10 text-gray-400 dark:text-zinc-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375" /></svg><span className="text-[9px] text-gray-400 dark:text-zinc-700 uppercase tracking-wider font-medium">Film</span></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 dark:from-[#08080d] via-transparent to-transparent opacity-60" />
                                    {review.rating > 0 && (
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-accent-400 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            {review.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 line-clamp-2 group-hover:text-primary-400 transition-colors">{review.title}</h3>
                                    {review.categories && review.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {review.categories.slice(0, 2).map((cat) => (
                                                <span key={cat.id} className="text-[10px] px-2 py-0.5 bg-white/[0.04] text-zinc-500 rounded-full">{cat.name}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] text-zinc-600 mt-auto pt-1">
                                        <span>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {formatViewCount(review.viewCount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                )}
            </section>

            {/* Ad Banner */}
            <AdLeaderboard />

            {/* ── Two-column: Truyện Chữ + Trending ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up-delay-2">
                {/* Text stories - 2 cols */}
                <div className="lg:col-span-2">
                    <SectionHeader
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                        title="Truyện Chữ Mới Nhất"
                        subtitle="Đọc truyện văn bản mới cập nhật"
                        href="/truyen-text"
                        accentColor="neon"
                    />
                    {textStories.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
                            {textStories.slice(0, 8).map((story) => (
                                <StoryCard key={story.id} story={story} variant="card" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    )}
                </div>

                {/* Trending sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-20 space-y-6">
                        {/* Trending Reviews */}
                        <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>
                                </div>
                                Review Nổi Bật
                            </h3>
                            {trendingReviews.length > 0 ? (
                                <div className="space-y-3">
                                    {trendingReviews.slice(0, 5).map((review, index) => (
                                        <Link key={review.id} href={`/phim/${review.slug}`} className="flex gap-3 group">
                                            <span className="text-[11px] font-bold text-zinc-600 w-5 pt-0.5">{String(index + 1).padStart(2, "0")}</span>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[13px] font-medium text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white line-clamp-2 transition-colors">{review.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {renderStars(review.rating)}
                                                    <span className="text-[10px] text-zinc-600">{formatViewCount(review.viewCount)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-600 text-sm">Chưa có dữ liệu.</p>
                            )}
                        </div>

                        {/* Trending Stories */}
                        <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-accent-500/10 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                                </div>
                                Truyện Nổi Bật
                            </h3>
                            {trendingStories.length > 0 ? (
                                <div className="space-y-3">
                                    {trendingStories.slice(0, 5).map((story, index) => (
                                        <Link key={story.id} href={`${story.type === "AUDIO" ? "/truyen-audio" : "/truyen-text"}/${story.slug}`} className="flex gap-3 group">
                                            <span className="text-[11px] font-bold text-zinc-600 w-5 pt-0.5">{String(index + 1).padStart(2, "0")}</span>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[13px] font-medium text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white line-clamp-2 transition-colors">{story.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                                                    <span>{(story as any).author?.name || ""}</span>
                                                    <span>&middot;</span>
                                                    <span>{formatViewCount(story.viewCount || 0)} views</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-600 text-sm">Chưa có dữ liệu.</p>
                            )}
                        </div>

                        {/* Quick links */}
                        <div className="bg-white border border-gray-200 dark:bg-white/[0.02] dark:border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Danh mục</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { href: "/phim", label: "Review Phim", color: "text-primary-400" },
                                    { href: "/phim?sort=rating", label: "Top Phim Hay", color: "text-accent-400" },
                                    { href: "/the-loai", label: "Thể loại", color: "text-zinc-400" },
                                    { href: "/truyen-text?sort=viewCount", label: "Xem nhiều", color: "text-zinc-400" },
                                    { href: "/truyen-text?sort=createdAt", label: "Mới nhất", color: "text-zinc-400" },
                                    { href: "/truyen-text?status=COMPLETED", label: "Hoàn thành", color: "text-zinc-400" },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href} className={`text-[12px] ${item.color} hover:text-gray-900 dark:hover:text-white py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] border border-gray-200 dark:border-white/[0.04] transition-all`}>{item.label}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ad Banner */}
            <AdLeaderboard />

            {/* Affiliate Popup */}
            {popupReview && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4">
                    <div className="relative bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1030] dark:to-[#0e0e1c] border border-gray-200 dark:border-white/[0.10] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
                        {/* Thumbnail hero */}
                        {popupReview.thumbnailUrl && (
                            <div className="relative h-44 w-full">
                                <Image src={getMediaUrl(popupReview.thumbnailUrl)} alt={popupReview.title} fill className="object-cover" sizes="400px" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0e0e1c] via-white/50 dark:via-[#0e0e1c]/50 to-transparent" />
                                {/* Play icon ovserlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/40">
                                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="px-6 pb-6 pt-2 text-center">
                            <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-1">Review Phim</p>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 line-clamp-2">{popupReview.title}</h3>
                            <button
                                onClick={() => {
                                    if (popupReview.affiliate?.targetUrl) {
                                        markAffiliateShown(popupReview.affiliate.targetUrl);
                                        openAffiliateLink(popupReview.affiliate.targetUrl);
                                    }
                                    const slug = popupReview.slug;
                                    setPopupReview(null);
                                    router.push(`/phim/${slug}`);
                                }}
                                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-primary-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                Xem Phim Ngay
                            </button>
                            <button
                                onClick={() => { const slug = popupReview.slug; setPopupReview(null); router.push(`/phim/${slug}`); }}
                                className="mt-2.5 w-full py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
                            >
                                Xem Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomepageContent;
