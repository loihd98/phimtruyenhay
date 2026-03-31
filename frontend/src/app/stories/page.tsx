import { redirect } from "next/navigation";

// Redirect old /stories URLs to new canonical pages
export default async function StoriesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const type = searchParams.type as string;
  const genre = searchParams.genre as string;

  const forwardParams = new URLSearchParams();
  if (searchParams.genre) forwardParams.set("genre", genre);
  if (searchParams.search) forwardParams.set("search", searchParams.search as string);
  if (searchParams.sort) forwardParams.set("sort", searchParams.sort as string);
  if (searchParams.page && searchParams.page !== "1") forwardParams.set("page", searchParams.page as string);
  const qs = forwardParams.toString();

  if (genre) {
    redirect(`/the-loai/${encodeURIComponent(genre)}${qs ? `?${qs}` : ""}`);
  }
  if (type === "AUDIO") {
    redirect(`/truyen-audio${qs ? `?${qs}` : ""}`);
  }
  redirect(`/truyen-text${qs ? `?${qs}` : ""}`);
}
