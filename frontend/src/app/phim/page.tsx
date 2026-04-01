import React from "react";
import { Metadata } from "next";
import Layout from "../../components/layout/Layout";
import FilmReviewsClient from "./FilmReviewsClient";
import JsonLd, {
  getFilmReviewsListSchema,
  getBreadcrumbSchema,
} from "../../components/seo/JsonLd";

const API_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "/api";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://phimtruyenhay.com";

// SSR: Fetch categories and tags on server
async function getFilmCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/film-reviews/categories`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error("SSR getFilmCategories error:", e);
    return [];
  }
}

async function getFilmTags() {
  try {
    const res = await fetch(`${API_BASE_URL}/film-reviews/tags`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error("SSR getFilmTags error:", e);
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const category = searchParams.category as string;
  const tag = searchParams.tag as string;
  const search = searchParams.search as string;

  let title = "Review Phim Mới Nhất 2026 – Đánh Giá Chi Tiết & Không Spoiler | Phim Truyện Hay";
  let description =
    "Đọc review phim mới nhất, đánh giá chi tiết nội dung, diễn xuất, kịch bản và điểm số khách quan tại Phim Truyện Hay.";

  if (category) {
    title = `Review Phim - ${category} | Phim Truyện Hay`;
    description = `Review phim thể loại ${category}. Xem đánh giá, xếp hạng phim mới nhất.`;
  }

  if (tag) {
    title = `Review Phim - #${tag} | Phim Truyện Hay`;
    description = `Review phim với tag #${tag}. Xem đánh giá, xếp hạng phim.`;
  }

  if (search) {
    title = `Tìm kiếm: ${search} - Review Phim | Phim Truyện Hay`;
    description = `Kết quả tìm kiếm review phim cho "${search}".`;
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
      canonical: "/phim",
    },
  };
}

export default async function FilmReviewsPage() {
  const [categories, tags] = await Promise.all([
    getFilmCategories(),
    getFilmTags(),
  ]);

  return (
    <>
      <JsonLd data={getFilmReviewsListSchema(siteUrl)} />
      <JsonLd
        data={getBreadcrumbSchema(
          [
            { name: "Trang chủ", url: "/" },
            { name: "Review Phim", url: "/phim" },
          ],
          siteUrl
        )}
      />
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
          <div className="mb-8 hidden sm:block">
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-4">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625" /></svg>
              <span className="text-[12px] font-medium text-primary-400 uppercase tracking-wider">Film Reviews</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Review Phim</h1>
            <p className="text-base text-zinc-500 max-w-xl">Khám phá các bài review phim hay nhất, xếp hạng và đánh giá</p>
          </div>

          <FilmReviewsClient categories={categories} tags={tags} />
        </div>
      </Layout>
    </>
  );
}
