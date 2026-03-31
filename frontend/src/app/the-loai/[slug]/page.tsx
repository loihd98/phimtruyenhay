import { Metadata } from "next";
import Layout from "../../../components/layout/Layout";
import StoriesClient from "../../stories/StoriesClient";
import StorySidebar from "../../../components/layout/StorySidebar";
import Link from "next/link";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost/api";

async function fetchGenreBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/stories/genres`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const genres = data?.genres || data?.data || [];
    return genres.find(
      (g: any) => g.slug === slug || g.name.toLowerCase().replace(/\s+/g, "-") === slug
    );
  } catch {
    return null;
  }
}

async function fetchStoriesByGenre(slug: string, searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const params = new URLSearchParams();
    params.set("page", (searchParams.page as string) || "1");
    params.set("limit", "10");
    params.set("genre", slug);
    if (searchParams.sort) params.set("sort", searchParams.sort as string);

    const res = await fetch(`${API_URL}/stories?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) return { stories: [], pagination: null };
    const data = await res.json();
    return {
      stories: data?.data?.data || data?.data || [],
      pagination: data?.data?.pagination || data?.pagination || null,
    };
  } catch {
    return { stories: [], pagination: null };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const genre = await fetchGenreBySlug(params.slug);
  const genreName = genre?.name || params.slug;

  return {
    title: `Thể loại ${genreName} – Truyện Audio, Truyện Chữ & Phim ${genreName}`,
    description: `Khám phá thể loại ${genreName} hay nhất. Nghe truyện audio, đọc truyện chữ và xem review phim ${genreName} miễn phí tại The Midnight Movie Reel.`,
    openGraph: {
      title: `Thể loại ${genreName} – The Midnight Movie Reel`,
      description: `Kho truyện audio, truyện chữ và review phim ${genreName} hay nhất, cập nhật liên tục.`,
      type: "website",
      locale: "vi_VN",
    },
    alternates: {
      canonical: `/the-loai/${params.slug}`,
    },
  };
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [genre, { stories, pagination }] = await Promise.all([
    fetchGenreBySlug(params.slug),
    fetchStoriesByGenre(params.slug, searchParams),
  ]);

  const genreName = genre?.name || params.slug;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-primary-400 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/the-loai" className="hover:text-primary-400 transition-colors">Thể loại</Link>
          <span>/</span>
          <span className="text-white font-medium">{genreName}</span>
        </nav>

        <div className="mb-8 hidden sm:block">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-medium border rounded-full bg-cinema-purple/10 text-cinema-purple border-cinema-purple/20">
              Thể loại
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {genreName}
          </h1>
          <p className="text-zinc-500 text-sm">
            Khám phá truyện thể loại {genreName} hay nhất
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <StoriesClient
              initialStories={stories}
              initialPagination={pagination}
              basePath={`/the-loai/${params.slug}`}
            />
          </div>
          <div className="lg:col-span-1">
            <StorySidebar />
          </div>
        </div>
      </div>
    </Layout>
  );
}
