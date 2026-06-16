"use client";

import { startOfWeek, addDays, isSameDay, format } from "date-fns";
import { PostChip } from "./post-chip";
import { CalendarPost } from "./calendar-client";

interface CalendarWeekViewProps {
  currentDate: Date;
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

interface TimeSlot {
  label: string;
  match: (hour: number) => boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "Early (Before 8 AM)", match: (h) => h < 8 },
  { label: "08:00 AM - 10:00 AM", match: (h) => h >= 8 && h < 10 },
  { label: "10:00 AM - 12:00 PM", match: (h) => h >= 10 && h < 12 },
  { label: "12:00 PM - 02:00 PM", match: (h) => h >= 12 && h < 14 },
  { label: "02:00 PM - 04:00 PM", match: (h) => h >= 14 && h < 16 },
  { label: "04:00 PM - 06:00 PM", match: (h) => h >= 16 && h < 18 },
  { label: "06:00 PM - 08:00 PM", match: (h) => h >= 18 && h < 20 },
  { label: "08:00 PM - 10:00 PM", match: (h) => h >= 20 && h < 22 },
  { label: "Late (After 10 PM)", match: (h) => h >= 22 },
];

export function CalendarWeekView({
  currentDate,
  posts,
  onPostClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper to match posts to day and time slot
  const getPostsForSlot = (day: Date, slot: TimeSlot) => {
    return posts.filter((post) => {
      const postDate = post.scheduledAt
        ? new Date(post.scheduledAt)
        : post.publishedAt
          ? new Date(post.publishedAt)
          : new Date(post.createdAt);

      if (!isSameDay(postDate, day)) return false;
      const hour = postDate.getHours();
      return slot.match(hour);
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
      {/* Grid Table Layout */}
      <div className="min-w-[800px] flex flex-col">
        {/* Header Row: Time Label + 7 Days */}
        <div className="grid grid-cols-[140px_repeat(7,1fr)] border-b border-border/40 bg-muted/20">
          <div className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border/40 flex items-center justify-center">
            Time
          </div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="p-3 text-center border-r last:border-r-0 border-border/40 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {format(day, "eee")}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time Slot Rows */}
        <div className="divide-y divide-border/40 bg-background">
          {TIME_SLOTS.map((slot, slotIdx) => (
            <div key={slotIdx} className="grid grid-cols-[140px_repeat(7,1fr)] min-h-[80px]">
              {/* Time Label Column */}
              <div className="p-3 border-r border-border/40 bg-muted/5 flex items-center justify-center text-center">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {slot.label}
                </span>
              </div>

              {/* Day Columns for the Time Slot */}
              {weekDays.map((day) => {
                const slotPosts = getPostsForSlot(day, slot);
                return (
                  <div
                    key={day.toISOString()}
                    className="p-2 border-r last:border-r-0 border-border/40 flex flex-col gap-1.5 overflow-y-auto"
                  >
                    {slotPosts.map((post) => {
                      const postDate = post.scheduledAt
                        ? new Date(post.scheduledAt)
                        : post.publishedAt
                          ? new Date(post.publishedAt)
                          : new Date(post.createdAt);
                      const displayTime = format(postDate, "h:mm a");

                      return (
                        <div key={post.id} className="relative group">
                          <PostChip post={post} onClick={() => onPostClick(post)} />
                          <span className="absolute -top-2 -right-1 hidden group-hover:block bg-popover border border-border/40 text-[9px] px-1 rounded shadow-sm text-muted-foreground font-semibold">
                            {displayTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
