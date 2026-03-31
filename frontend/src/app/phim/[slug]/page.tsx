import React from "react";
import { Metadata } from "next";
import Layout from "../../../components/layout/Layout";
import FilmReviewDetail from "./FilmReviewDetail";
import JsonLd, {
  getFilmReviewSchema,
  getBreadcrumbSchema,
} from "../../../components/seo/JsonLd";

const API_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "/api";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://themidnightmoviereel.io.vn";

// SSR: Fetch film review on server for SEO
async function getFilmReview(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/film-reviews/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const filmReview = await getFilmReview(params.slug);

  if (!filmReview) {
    return {
      title: "Không tìm thấy review phim | The Midnight Movie Reel",
      description: "Bài review phim không tồn tại hoặc đã bị xóa.",
    };
  }

  const episodeCount = filmReview.episodes?.length || filmReview.totalEpisodes || 1;
  const isMultiEpisode = episodeCount > 1;
  const langLabel =
    filmReview.language === "VIETSUB" ? "Vietsub" :
    filmReview.language === "THUYET_MINH" ? "Thuyết Minh" :
    filmReview.language === "LONG_TIENG" ? "Lồng Tiếng" :
    filmReview.language === "RAW" ? "Raw" : "";

  const titleParts = [filmReview.title];
  if (langLabel) titleParts.push(langLabel);
  if (isMultiEpisode) titleParts.push(`${episodeCount} Tập`);
  const title = `${titleParts.join(" - ")} | The Midnight Movie Reel`;

  const descParts: string[] = [];
  if (filmReview.description) {
    descParts.push(filmReview.description.replace(/<[^>]*>/g, "").substring(0, 120));
  }
  descParts.push(`Đánh giá: ${filmReview.rating}/10`);
  if (langLabel) descParts.push(langLabel);
  if (isMultiEpisode) descParts.push(`${episodeCount} tập`);
  const description = descParts.join(". ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "vi_VN",
      images: filmReview.thumbnailUrl
        ? [{ url: filmReview.thumbnailUrl, width: 800, height: 450 }]
        : undefined,
    },
    alternates: {
      canonical: `/phim/${params.slug}`,
    },
  };
}

export default async function FilmReviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const filmReview = await getFilmReview(params.slug);

  return (
    <>
      {filmReview && (
        <>
          <JsonLd data={getFilmReviewSchema(filmReview, siteUrl)} />
          <JsonLd
            data={getBreadcrumbSchema(
              [
                { name: "Trang chủ", url: "/" },
                { name: "Review Phim", url: "/phim" },
                {
                  name: filmReview.title,
                  url: `/phim/${params.slug}`,
                },
              ],
              siteUrl
            )}
          />
        </>
      )}
      <Layout>
        <FilmReviewDetail initialData={filmReview} slug={params.slug} />
      </Layout>
    </>
  );
}
