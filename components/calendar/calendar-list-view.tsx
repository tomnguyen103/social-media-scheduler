"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { PLATFORM_ICONS } from "./post-chip";
import { Eye, Edit3, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { CalendarPost } from "./calendar-client";

interface CalendarListViewProps {
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

const STATUS_VARIANTS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/30",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
  partial_failure: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
};

export function CalendarListView({ posts, onPostClick }: CalendarListViewProps) {
  const router = useRouter();

  // Sort posts chronologically: scheduledAt or publishedAt or createdAt
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = a.scheduledAt
      ? new Date(a.scheduledAt).getTime()
      : a.publishedAt
        ? new Date(a.publishedAt).getTime()
        : new Date(a.createdAt).getTime();
    const dateB = b.scheduledAt
      ? new Date(b.scheduledAt).getTime()
      : b.publishedAt
        ? new Date(b.publishedAt).getTime()
        : new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  if (sortedPosts.length === 0) {
    return (
      <Empty className="border border-dashed py-16">
        <EmptyHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calendar className="size-6" />
          </div>
          <EmptyTitle className="mt-4 text-base font-semibold">No posts found</EmptyTitle>
          <EmptyDescription className="text-sm">
            Try adjusting your filters or date selection, or create a new post to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="p-4">Date & Time</th>
              <th className="p-4">Content Preview</th>
              <th className="p-4">Target Platforms</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-sm bg-background">
            {sortedPosts.map((post) => {
              const dateToFormat = post.scheduledAt
                ? new Date(post.scheduledAt)
                : post.publishedAt
                  ? new Date(post.publishedAt)
                  : new Date(post.createdAt);

              const formattedDate = format(dateToFormat, "MMM d, yyyy");
              const formattedTime = format(dateToFormat, "h:mm a");

              const title = post.content ? post.content.split("\n")[0] : "Untitled Post";
              const displayTitle = title.length > 50 ? `${title.slice(0, 50)}...` : title;

              return (
                <tr
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="hover:bg-muted/10 transition duration-150 cursor-pointer"
                >
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-foreground">{formattedDate}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formattedTime}</div>
                  </td>
                  <td className="p-4 max-w-xs md:max-w-md">
                    <div className="font-medium text-foreground truncate">{displayTitle || "No content"}</div>
                    {post.content && post.content.split("\n").length > 1 && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {post.content.split("\n").slice(1).join(" ")}
                      </div>
                    )}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.targets.length === 0 ? (
                        <span className="text-xs italic text-muted-foreground">None</span>
                      ) : (
                        post.targets.map((target, idx) => {
                          const icon = PLATFORM_ICONS[target.platform] || "🔗";
                          return (
                            <Badge
                              key={target.id || idx}
                              variant="outline"
                              className="px-1.5 py-0 text-[10px] font-medium bg-muted/40"
                              title={`${target.platform}: ${target.platformUsername}`}
                            >
                              <span className="mr-1">{icon}</span>
                              <span className="capitalize">{target.platform}</span>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_VARIANTS[post.status] || STATUS_VARIANTS.draft
                      )}
                    >
                      {post.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onPostClick(post)}
                        title="View Details"
                        className="cursor-pointer"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => router.push(`/composer?id=${post.id}`)}
                        title="Edit Post"
                        className="cursor-pointer"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
