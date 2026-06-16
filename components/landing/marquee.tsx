"use client";

import React from "react";

const platforms = [
  { name: "Instagram", icon: "📸", color: "hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/5" },
  { name: "YouTube", icon: "▶️", color: "hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5" },
  { name: "TikTok", icon: "🎵", color: "hover:text-cyan-500 hover:border-cyan-500/30 hover:bg-cyan-500/5" },
  { name: "Facebook", icon: "📘", color: "hover:text-blue-600 hover:border-blue-600/30 hover:bg-blue-600/5" },
  { name: "LinkedIn", icon: "👔", color: "hover:text-sky-600 hover:border-sky-600/30 hover:bg-sky-600/5" },
  { name: "Pinterest", icon: "📌", color: "hover:text-red-600 hover:border-red-600/30 hover:bg-red-600/5" },
  { name: "Discord", icon: "💬", color: "hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/5" },
  { name: "Twitter/X", icon: "🐦", color: "hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5" },
  { name: "Slack", icon: "💼", color: "hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5" },
];

// Double the items to make the infinite scroll smooth and continuous
const marqueeItems = [...platforms, ...platforms, ...platforms];

export function PlatformMarquee() {
  return (
    <section className="border-y border-border/40 bg-muted/20 py-8 overflow-hidden relative w-full">
      {/* Fade overlay masks */}
      <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex w-max">
        {/* Scrolling Track */}
        <div className="flex gap-6 animate-marquee shrink-0">
          {marqueeItems.map((platform, idx) => (
            <div
              key={`${platform.name}-${idx}`}
              className={`flex items-center gap-2 rounded-full border border-border/40 bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-300 ${platform.color}`}
            >
              <span className="text-base">{platform.icon}</span>
              <span>{platform.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind v4 keyframe inject style tag if marquee class is not pre-compiled */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.3333%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
