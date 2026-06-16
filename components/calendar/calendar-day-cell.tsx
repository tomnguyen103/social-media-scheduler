"use client";

import { useState } from "react";
import { format, isToday as checkIsToday, isSameMonth } from "date-fns";
import { PostChip } from "./post-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarPost } from "./calendar-client";

interface CalendarDayCellProps {
  day: Date;
  currentDate: Date;
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

export function CalendarDayCell({
  day,
  currentDate,
  posts,
  onPostClick,
}: CalendarDayCellProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isToday = checkIsToday(day);
  const isCurrentMonth = isSameMonth(day, currentDate);

  const maxVisibleChips = 3;
  const visiblePosts = posts.slice(0, maxVisibleChips);
  const hiddenPostsCount = posts.length - maxVisibleChips;

  return (
    <div
      className={cn(
        "group flex min-h-[110px] flex-col border-r border-b border-border/40 p-2 transition-colors duration-150 hover:bg-muted/10",
        !isCurrentMonth && "bg-muted/5 text-muted-foreground opacity-40"
      )}
    >
      {/* Day Header */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
            isToday
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {format(day, "d")}
        </span>

        {posts.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        )}
      </div>

      {/* Post Chips */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {visiblePosts.map((post) => (
          <PostChip
            key={post.id}
            post={post}
            onClick={() => onPostClick(post)}
          />
        ))}

        {/* More than maxVisibleChips posts indicator */}
        {hiddenPostsCount > 0 && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="w-full rounded-md bg-muted/40 hover:bg-muted py-0.5 text-center text-[10px] font-semibold text-muted-foreground transition cursor-pointer"
                />
              }
            >
              + {hiddenPostsCount} more
            </PopoverTrigger>
            <PopoverContent
              align="center"
              side="bottom"
              className="w-64 p-3 bg-popover border border-border shadow-lg rounded-xl flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {format(day, "MMMM d, yyyy")}
                </h4>
                <span className="text-xs font-semibold text-foreground">
                  {posts.length} Posts
                </span>
              </div>
              <ScrollArea className="max-h-48 pr-1">
                <div className="space-y-1.5 py-1">
                  {posts.map((post) => (
                    <PostChip
                      key={post.id}
                      post={post}
                      onClick={() => {
                        setPopoverOpen(false);
                        onPostClick(post);
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
