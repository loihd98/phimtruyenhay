import { Metadata } from "next";
import StoryDetailClient from "../../stories/[slug]/StoryDetailClient";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost/api";

async function fetchStory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/stories/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.story || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const story = await fetchStory(params.slug);

  if (!story) {
    return {
      title: "Truyện không tồn tại – The Midnight Movie Reel",
      description: "Truyện bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const title = `${story.title} – Đọc Truyện Online | The Midnight Movie Reel`;
  const description =
    story.description?.substring(0, 160) ||
    `Đọc ${story.title} – Truyện Chữ miễn phí tại The Midnight Movie Reel. ${story.chapters?.length || 0} chương.`;

  return {
    title,
    description,
    keywords: [
      story.title,
      "truyện chữ",
      "đọc truyện",
      ...(story.genres?.map((g: any) => g.name) || []),
      "vivutruyenghay",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      locale: "vi_VN",
      siteName: "The Midnight Movie Reel",
      ...(story.thumbnailUrl && {
        images: [
          {
            url: story.thumbnailUrl.startsWith("http")
              ? story.thumbnailUrl
              : `${process.env.NEXT_PUBLIC_SITE_URL || "https://themidnightmoviereel.io.vn"}${story.thumbnailUrl}`,
            width: 1200,
            height: 630,
            alt: story.title,
          },
        ],
      }),
    },
    alternates: {
      canonical: `/truyen-text/${params.slug}`,
    },
  };
}

export default async function TextStoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const story = await fetchStory(params.slug);

  return <StoryDetailClient params={params} initialStory={story} />;
}
