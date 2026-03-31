"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "in-article";
  responsive?: boolean;
  className?: string;
  layout?: string;
}

export default function AdBanner({ slot, format = "auto", responsive = true, className = "", layout }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return;
    if (!slot) return;
    if (isLoaded.current) return;

    const timer = setTimeout(() => {
      try {
        const adEl = adRef.current?.querySelector("ins");
        if (adEl && adEl.getAttribute("data-adsbygoogle-status") === null) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch {
        // AdSense not loaded
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [slot]);

  const isInArticle = format === "in-article";

  // If no client ID or slot, show a placeholder area so user sees where ads will appear
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || !slot) {
    return (
      <div className={`ad-banner overflow-hidden my-6 ${className}`}>
        <div className="w-full border border-dashed border-zinc-700/50 rounded-xl bg-zinc-900/30 flex items-center justify-center text-zinc-600 text-xs py-8">
          <svg className="w-4 h-4 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          Ad Space
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={`ad-banner overflow-hidden my-6 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={isInArticle ? "fluid" : format}
        data-full-width-responsive={responsive ? "true" : "false"}
        {...(isInArticle ? { "data-ad-layout": "in-article" } : {})}
        {...(layout ? { "data-ad-layout": layout } : {})}
      />
    </div>
  );
}

/** Horizontal leaderboard ad - for between content sections */
export function AdLeaderboard({ className = "" }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD || "";
  return <AdBanner slot={slot} format="horizontal" className={`max-w-4xl mx-auto ${className}`} />;
}

/** Rectangle ad - for in-content / sidebar */
export function AdRectangle({ className = "" }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE || "";
  return <AdBanner slot={slot} format="rectangle" className={className} />;
}

/** In-article ad - for inside long articles */
export function AdInArticle({ className = "" }: { className?: string }) {
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE || "";
  return <AdBanner slot={slot} format="in-article" className={className} />;
}
