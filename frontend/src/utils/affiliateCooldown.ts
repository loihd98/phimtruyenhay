/**
 * Affiliate popup cooldown utility.
 * - Per URL: tracks shown affiliate links (24h cooldown).
 * - Per item: tracks shown popups per story/film/chapter (24h cooldown).
 *   Resets every 24 hours so users see it again the next day.
 */

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day)
const URL_PREFIX = "aff_url_";
const ITEM_PREFIX = "aff_item_";

function safeKey(prefix: string, id: string): string {
  try { return prefix + btoa(unescape(encodeURIComponent(id))).slice(0, 40); }
  catch { return prefix + id.slice(0, 40); }
}

/** Check if a targetUrl-based popup is in 24h cooldown. */
export function isAffiliateCooldown(targetUrl: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(safeKey(URL_PREFIX, targetUrl));
    if (!stored) return false;
    return Date.now() - parseInt(stored, 10) < COOLDOWN_MS;
  } catch { return false; }
}

/** Mark a targetUrl as shown (start 24h cooldown). */
export function markAffiliateShown(targetUrl: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(safeKey(URL_PREFIX, targetUrl), Date.now().toString()); }
  catch { }
}

/**
 * Per-item cooldown – keyed by story ID, film ID, or "storyId-ch-N".
 * Returns true if this item's popup was already shown within 24h.
 */
export function isShownForItem(itemId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(safeKey(ITEM_PREFIX, itemId));
    if (!stored) return false;
    return Date.now() - parseInt(stored, 10) < COOLDOWN_MS;
  } catch { return false; }
}

/** Mark an item as shown (start 24h cooldown). */
export function markShownForItem(itemId: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(safeKey(ITEM_PREFIX, itemId), Date.now().toString()); }
  catch { }
}

/** Open an affiliate link in a new background tab with consistent security options. */
export function openAffiliateLink(url: string): void {
  if (typeof window === "undefined" || !url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
