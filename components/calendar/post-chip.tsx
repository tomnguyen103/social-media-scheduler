"use client";

import { cn } from "@/lib/utils";

interface PostChipProps {
  post: {
    id: string;
    content: string;
    status: string;
    targets: Array<{ platform: string }>;
  };
  onClick?: () => void;
  className?: string;
}

export const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  youtube: "▶️",
  tiktok: "🎵",
  facebook: "📘",
  linkedin: "👔",
  pinterest: "📌",
  discord: "💬",
  twitter: "🐦",
  slack: "💼",
};

const STATUS_CLASSES: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 hover:bg-blue-500/20",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-500/20",
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/30 hover:bg-zinc-500/20",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 hover:bg-rose-500/20",
  partial_failure: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:bg-amber-500/20",
};

export function PostChip({ post, onClick, className }: PostChipProps) {
  const statusClass = STATUS_CLASSES[post.status] || STATUS_CLASSES.draft;
  
  // Extract first line of content or truncate
  const title = post.content ? post.content.split("\n")[0].trim() : "Untitled Post";
  const displayTitle = title.length > 20 ? `${title.slice(0, 20)}...` : title;

  // Get unique platform icons
  const platformIcons = post.targets
    .map((t) => PLATFORM_ICONS[t.platform] || "🔗")
    .filter((value, index, self) => self.indexOf(value) === index);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-left text-xs font-medium transition duration-150 ease-in-out select-none cursor-pointer",
        statusClass,
        className
      )}
    >
      <span className="flex items-center gap-0.5 shrink-0">
        {platformIcons.length > 0 ? (
          platformIcons.slice(0, 3).map((icon, idx) => (
            <span key={idx} className="text-[10px]">
              {icon}
            </span>
          ))
        ) : (
          <span className="text-[10px]">📝</span>
        )}
        {platformIcons.length > 3 && (
          <span className="text-[8px] font-bold">+{platformIcons.length - 3}</span>
        )}
      </span>
      <span className="truncate flex-1">{displayTitle || "Empty content"}</span>
    </button>
  );
}
