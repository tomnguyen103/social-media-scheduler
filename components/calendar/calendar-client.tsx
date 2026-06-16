"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Loader2,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CalendarGrid } from "./calendar-grid";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarListView } from "./calendar-list-view";
import { PostDetailPanel } from "./post-detail-panel";
import { PLATFORM_ICONS } from "./post-chip";

export interface CalendarPost {
  id: string;
  content: string;
  mediaUrls: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  targets: Array<{
    id: string;
    connectedAccountId: string;
    status: string;
    errorMessage: string | null;
    platform: string;
    platformUsername: string;
  }>;
}

interface ConnectedAccount {
  id: string;
  platform: string;
  platformUsername: string;
}

interface CalendarClientProps {
  initialAccounts: ConnectedAccount[];
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", emoji: "📝" },
  { value: "scheduled", label: "Scheduled", emoji: "⏱️" },
  { value: "published", label: "Published", emoji: "✅" },
  { value: "failed", label: "Failed", emoji: "❌" },
  { value: "partial_failure", label: "Partial Failure", emoji: "⚠️" },
];

export function CalendarClient({ initialAccounts }: CalendarClientProps) {
  const router = useRouter();

  // Calendar Date & View States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"month" | "week" | "list">("month");

  // Filters State
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Data State
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Side Panel details State
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Defer state setter to next tick to satisfy linter and prevent cascading renders
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const monthStr = format(currentDate, "yyyy-MM");
        const res = await fetch(`/api/posts/calendar?month=${monthStr}`);
        if (!res.ok) {
          throw new Error("Failed to load posts from calendar API");
        }
        const data = await res.json();
        if (isMounted) {
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          toast.error("Failed to load posts for the selected month.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  // Navigate Date
  const handlePrev = () => {
    if (currentView === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (currentView === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle Status Filter
  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Toggle Platform Filter
  const togglePlatformFilter = (accountId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Reset Filters
  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedPlatforms([]);
    toast.success("Filters cleared");
  };

  // Filter Posts locally
  const filteredPosts = posts.filter((post) => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status)) {
      return false;
    }
    if (selectedPlatforms.length > 0) {
      const postAccountIds = post.targets.map((t) => t.connectedAccountId);
      const matchesPlatform = selectedPlatforms.some((id) =>
        postAccountIds.includes(id)
      );
      if (!matchesPlatform) return false;
    }
    return true;
  });

  // Details panel handlers
  const handlePostClick = (post: CalendarPost) => {
    setSelectedPost(post);
    setIsPanelOpen(true);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handlePostUpdated = (updatedPost: CalendarPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    setSelectedPost(updatedPost);
  };

  // Format header title text
  const getHeaderTitle = () => {
    if (currentView === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      // If same month
      if (format(start, "MMM") === format(end, "MMM")) {
        return `${format(start, "MMMM yyyy")} (Week of ${format(start, "d")})`;
      }
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Schedule, visualize, and review your multi-platform post timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/composer")}
            className="rounded-xl shadow-[0_8px_20px_-6px_oklch(0.6_0.27_296_/_0.3)] font-semibold cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" /> Create Post
          </Button>
        </div>
      </div>

      {/* Control Bar: Pagination, Filters, View Toggles */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation & Date Label */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/40 overflow-hidden bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="h-9 w-9 rounded-none border-r border-border/40 cursor-pointer"
              title={currentView === "week" ? "Previous week" : "Previous month"}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleToday}
              className="h-9 px-3 rounded-none border-r border-border/40 text-xs font-semibold cursor-pointer"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9 rounded-none cursor-pointer"
              title={currentView === "week" ? "Next week" : "Next month"}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <h3 className="text-sm font-bold text-foreground min-w-[140px] px-2">
            {getHeaderTitle()}
          </h3>
        </div>

        {/* Filters and View Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-xl h-9 text-xs font-medium gap-1.5 cursor-pointer",
                    selectedStatuses.length > 0 && "bg-primary/5 border-primary/30 text-primary"
                  )}
                />
              }
            >
              <Filter className="size-3.5" />
              <span>Status</span>
              {selectedStatuses.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                  {selectedStatuses.length}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-3 bg-popover border border-border shadow-lg rounded-xl flex flex-col gap-2.5"
            >
              <div className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">
                Filter by Status
              </div>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isChecked = selectedStatuses.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleStatusFilter(opt.value)}
                      />
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Platform Filter */}
          {initialAccounts.length > 0 && (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-xl h-9 text-xs font-medium gap-1.5 cursor-pointer",
                      selectedPlatforms.length > 0 && "bg-primary/5 border-primary/30 text-primary"
                    )}
                  />
                }
              >
                <Layers className="size-3.5" />
                <span>Platforms</span>
                {selectedPlatforms.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                    {selectedPlatforms.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-64 p-3 bg-popover border border-border shadow-lg rounded-xl flex flex-col gap-2.5"
              >
                <div className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">
                  Filter by Connected Accounts
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {initialAccounts.map((account) => {
                    const isChecked = selectedPlatforms.includes(account.id);
                    const emoji = PLATFORM_ICONS[account.platform] || "🔗";
                    return (
                      <label
                        key={account.id}
                        className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePlatformFilter(account.id)}
                        />
                        <span>{emoji}</span>
                        <span className="capitalize truncate">
                          {account.platform} ({account.platformUsername})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Reset Filters Indicator */}
          {(selectedStatuses.length > 0 || selectedPlatforms.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground h-9 cursor-pointer"
            >
              Clear filters
            </Button>
          )}

          <div className="h-6 w-px bg-border/40 hidden sm:block" />

          {/* View Toggles */}
          <div className="flex rounded-lg border border-border/40 p-0.5 bg-background">
            {(["month", "week", "list"] as const).map((view) => (
              <Button
                key={view}
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView(view)}
                className={cn(
                  "h-8 px-3 text-xs font-semibold rounded-md capitalize cursor-pointer",
                  currentView === view
                    ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary hover:text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {view}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-xs rounded-xl">
            <Loader2 className="size-8 animate-spin text-primary mb-2" />
            <span className="text-xs font-medium text-muted-foreground">Loading calendar data...</span>
          </div>
        ) : filteredPosts.length === 0 && posts.length > 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-16 text-center text-balance bg-card/20">
            <span className="text-2xl mb-2">🔍</span>
            <h3 className="font-bold text-sm">No matching posts found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              All {posts.length} posts in this time range are excluded by your current status/platform filters.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 rounded-xl cursor-pointer">
              Clear filters
            </Button>
          </div>
        ) : null}

        {/* View Grid Switcher */}
        {!isLoading && (
          <>
            {currentView === "month" && (
              <CalendarGrid
                currentDate={currentDate}
                posts={filteredPosts}
                onPostClick={handlePostClick}
              />
            )}
            {currentView === "week" && (
              <CalendarWeekView
                currentDate={currentDate}
                posts={filteredPosts}
                onPostClick={handlePostClick}
              />
            )}
            {currentView === "list" && (
              <CalendarListView
                posts={filteredPosts}
                onPostClick={handlePostClick}
              />
            )}
          </>
        )}
      </div>

      {/* Side Details Sheet Panel */}
      <PostDetailPanel
        key={selectedPost?.id || "none"}
        post={selectedPost}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
}
