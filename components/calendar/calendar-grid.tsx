"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { CalendarDayCell } from "./calendar-day-cell";
import { CalendarPost } from "./calendar-client";

interface CalendarGridProps {
  currentDate: Date;
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  currentDate,
  posts,
  onPostClick,
}: CalendarGridProps) {
  // Compute start/end of month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Pad to start/end of week so we get a complete grid
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  // Generate all days in grid range
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => {
      const postDate = post.scheduledAt
        ? new Date(post.scheduledAt)
        : post.publishedAt
          ? new Date(post.publishedAt)
          : new Date(post.createdAt);
      return isSameDay(postDate, day);
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
      {/* Weekdays Header */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 bg-background">
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          return (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              currentDate={currentDate}
              posts={dayPosts}
              onPostClick={onPostClick}
            />
          );
        })}
      </div>
    </div>
  );
}
