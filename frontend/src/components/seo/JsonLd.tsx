interface JsonLdProps {
  data: any;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Schema for Organization
export function getOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Midnight Movie Reel",
    url: siteUrl,
    logo: `${siteUrl}/logo_phim.png`,
    description:
      "Nghe truyện audio hay, đọc truyện chữ online miễn phí và review phim chuyên sâu tại The Midnight Movie Reel.",
    founder: {
      "@type": "Person",
      name: "The Midnight Movie Reel",
    },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["Vietnamese"],
    },
  };
}

// Schema for Website
export function getWebsiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Midnight Movie Reel",
    url: siteUrl,
    description:
      "Nghe truyện audio, đọc truyện chữ online miễn phí và review phim hay mỗi ngày tại The Midnight Movie Reel",
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo_phim.png`,
      },
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        name: "Tìm phim",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/phim?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "SearchAction",
        name: "Tìm truyện audio",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/truyen-audio?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "SearchAction",
        name: "Tìm truyện chữ",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/truyen-text?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
    inLanguage: "vi-VN",
  };
}

// Schema for Book (Story)
export function getBookSchema(story: any, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: story.title,
    description: story.description,
    url: `${siteUrl}/stories/${story.slug}`,
    image: story.coverImage || `${siteUrl}/logo_phim.png`,
    author: {
      "@type": "Person",
      name: story.author || "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
    },
    datePublished: story.createdAt,
    dateModified: story.updatedAt,
    inLanguage: "vi-VN",
    genre: story.genres?.join(", ") || "Fiction",
    aggregateRating: story.rating
      ? {
        "@type": "AggregateRating",
        ratingValue: story.rating.average,
        reviewCount: story.rating.count,
        bestRating: 5,
        worstRating: 1,
      }
      : undefined,
  };
}

// Schema for Article (Chapter)
export function getArticleSchema(chapter: any, story: any, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: chapter.title,
    description: story.description,
    url: `${siteUrl}/stories/${story.slug}/${chapter.slug}`,
    image: story.coverImage || `${siteUrl}/logo_phim.png`,
    author: {
      "@type": "Person",
      name: story.author || "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo_phim.png`,
      },
    },
    datePublished: chapter.createdAt,
    dateModified: chapter.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/stories/${story.slug}/${chapter.slug}`,
    },
    isPartOf: {
      "@type": "Book",
      name: story.title,
      url: `${siteUrl}/stories/${story.slug}`,
    },
    inLanguage: "vi-VN",
  };
}

// Schema for AudioBook
export function getAudioBookSchema(story: any, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AudioObject",
    name: story.title,
    description: story.description,
    url: `${siteUrl}/stories/${story.slug}`,
    thumbnail: story.coverImage || `${siteUrl}/logo_phim.png`,
    contentUrl: story.audioUrl,
    encodingFormat: "audio/mpeg",
    author: {
      "@type": "Person",
      name: story.author || "Anonymous",
    },
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
    },
    datePublished: story.createdAt,
    inLanguage: "vi-VN",
  };
}

// Schema for BreadcrumbList
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  siteUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

// Schema for Film Review (Review + Movie)
export function getFilmReviewSchema(review: any, siteUrl: string) {
  const episodeCount = review.episodes?.length || review.totalEpisodes || 1;
  const isMultiEpisode = episodeCount > 1;
  const isTVSeries = isMultiEpisode || review.isMovie === false;

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.description,
    url: `${siteUrl}/phim/${review.slug}`,
    datePublished: review.createdAt,
    dateModified: review.updatedAt,
    author: {
      "@type": "Person",
      name: review.author?.name || "The Midnight Movie Reel",
    },
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
      url: siteUrl,
    },
    reviewRating: review.rating
      ? {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 10,
        worstRating: 0,
      }
      : undefined,
    itemReviewed: {
      "@type": isTVSeries ? "TVSeries" : "Movie",
      name: review.title,
      image: review.thumbnailUrl || `${siteUrl}/logo_phim.png`,
      genre: review.categories?.map((c: any) => c.name) || [],
      actor: review.actors?.map((a: any) => ({
        "@type": "Person",
        name: a.name,
      })) || [],
      ...(isTVSeries && episodeCount > 0 ? { numberOfEpisodes: episodeCount } : {}),
      ...(review.episodes && review.episodes.length > 0 ? {
        containsSeason: [{
          "@type": "TVSeason",
          seasonNumber: 1,
          numberOfEpisodes: review.episodes.length,
          episode: review.episodes.map((ep: any) => ({
            "@type": "TVEpisode",
            episodeNumber: ep.episodeNum,
            name: ep.title || `Tập ${ep.episodeNum}`,
            ...(ep.duration ? { duration: `PT${ep.duration}M` } : {}),
            url: ep.videoUrl,
          })),
        }],
      } : {}),
    },
    inLanguage: "vi-VN",
  };
}

// Schema for Film Reviews List page
export function getFilmReviewsListSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Review Phim - The Midnight Movie Reel",
    description:
      "Xem các bài review phim hay nhất. Đánh giá phim, xếp hạng và nhận xét từ cộng đồng.",
    url: `${siteUrl}/phim`,
    publisher: {
      "@type": "Organization",
      name: "The Midnight Movie Reel",
      url: siteUrl,
    },
    inLanguage: "vi-VN",
  };
}
