const PROGRESS_PREFIX = "audio_progress_";
const LAST_PLAYED_KEY = "audio_last_played";

interface ChapterProgress {
  timestamp: number;
  updatedAt: number;
}

interface LastPlayed {
  storyId: string;
  storySlug: string;
  chapterNumber: number;
  timestamp: number;
  updatedAt: number;
}

export function saveChapterProgress(
  storyId: string,
  chapterNumber: number,
  timestamp: number
): void {
  if (typeof window === "undefined" || timestamp <= 0) return;
  const key = `${PROGRESS_PREFIX}${storyId}_ch${chapterNumber}`;
  const data: ChapterProgress = { timestamp, updatedAt: Date.now() };
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function getChapterProgress(
  storyId: string,
  chapterNumber: number
): number {
  if (typeof window === "undefined") return 0;
  const key = `${PROGRESS_PREFIX}${storyId}_ch${chapterNumber}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const data: ChapterProgress = JSON.parse(raw);
    return data.timestamp || 0;
  } catch {
    return 0;
  }
}

export function clearChapterProgress(
  storyId: string,
  chapterNumber: number
): void {
  if (typeof window === "undefined") return;
  const key = `${PROGRESS_PREFIX}${storyId}_ch${chapterNumber}`;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveLastPlayed(
  storyId: string,
  storySlug: string,
  chapterNumber: number,
  timestamp: number
): void {
  if (typeof window === "undefined") return;
  const data: LastPlayed = {
    storyId,
    storySlug,
    chapterNumber,
    timestamp,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getLastPlayed(): LastPlayed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastPlayed;
  } catch {
    return null;
  }
}
