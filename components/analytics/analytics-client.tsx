"use client";

import { useEffect, useState, startTransition, useCallback } from "react";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Percent, 
  TrendingUp,
  RotateCw,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatsCard } from "./stats-card";
import { PostsLineChart } from "./posts-line-chart";
import { PlatformDonutChart } from "./platform-donut-chart";
import { PlatformBarChart } from "./platform-bar-chart";
import { TopPostsTable } from "./top-posts-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia
} from "@/components/ui/empty";

type Stats = {
  totalPosts: number;
  scheduledPosts: number;
  totalReach: number;
  averageEngagementRate: number;
};

type ChartData = {
  postsPerDay: { date: string; posts: number; reach: number; engagement: number }[];
  postsByPlatform: { name: string; value: number }[];
  engagementByPlatform: { platform: string; engagementRate: number; totalEngagement: number; fill: string }[];
};

type PostItem = {
  id: string;
  content: string;
  mediaUrls: string[];
  publishedAt: string | Date;
  platforms: string[];
  reach: number;
  engagement: number;
  engagementRate: number;
};

export function AnalyticsClient() {
  const [range, setRange] = useState<string>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [activeRange, setActiveRange] = useState<{ range: string; start?: string; end?: string }>({ range: "30d" });

  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let overviewUrl = `/api/analytics/overview?range=${activeRange.range}`;
      let postsUrl = `/api/analytics/posts?range=${activeRange.range}`;

      if (activeRange.range === "custom" && activeRange.start) {
        overviewUrl += `&start=${activeRange.start}&end=${activeRange.end || ""}`;
        postsUrl += `&start=${activeRange.start}&end=${activeRange.end || ""}`;
      }

      const [overviewRes, postsRes] = await Promise.all([
        fetch(overviewUrl),
        fetch(postsUrl)
      ]);

      if (!overviewRes.ok || !postsRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const overviewData = await overviewRes.json();
      const postsData = await postsRes.json();

      setStats(overviewData.stats);
      setCharts(overviewData.charts);
      setPosts(postsData.posts);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    if (newRange !== "custom") {
      startTransition(() => {
        setActiveRange({ range: newRange });
      });
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStart) return;
    startTransition(() => {
      setActiveRange({
        range: "custom",
        start: customStart,
        end: customEnd || undefined,
      });
    });
  };

  const getTrendLabel = () => {
    switch (activeRange.range) {
      case "7d":
        return "vs previous 7 days";
      case "90d":
        return "vs previous 90 days";
      case "custom":
        return "in custom range";
      default:
        return "vs previous 30 days";
    }
  };

  if (!loading && stats && stats.totalPosts === 0) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12">
        <Empty className="border border-dashed py-14 bg-card rounded-xl">
          <EmptyMedia variant="icon">
            <TrendingUp className="size-5" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-foreground">No Analytics Data Yet</EmptyTitle>
            <EmptyDescription className="text-xs max-w-sm">
              We&apos;ll start tracking reach, impressions, likes, and comment engagement as soon as you publish your first post.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push("/dashboard/composer")} className="rounded-xl font-bold mt-2 shadow-sm cursor-pointer">
              Compose Your First Post
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section with Filter controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Analytics Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and track your social channel performance indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/50 p-1 shadow-sm shrink-0">
            {["7d", "30d", "90d", "custom"].map((preset) => (
              <button
                key={preset}
                onClick={() => handleRangeChange(preset)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                  range === preset
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset === "custom" ? "Custom" : preset}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {range === "custom" && (
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-1 px-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 rounded-lg border-0 bg-transparent text-xs font-semibold focus:ring-0 focus:outline-none"
              />
              <span className="text-muted-foreground text-[10px] font-bold uppercase">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 rounded-lg border-0 bg-transparent text-xs font-semibold focus:ring-0 focus:outline-none"
              />
              <Button 
                size="sm" 
                onClick={handleApplyCustomRange}
                className="h-7 px-3 bg-primary hover:brightness-105 text-primary-foreground font-bold rounded-lg text-xs"
              >
                Apply
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="size-9 rounded-xl border-border bg-card/60 hover:bg-muted/50 shadow-sm shrink-0"
            title="Refresh analytics data"
          >
            <RotateCw className={`size-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive-foreground">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <div className="flex-1 text-sm font-semibold">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchData} className="border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards Row */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border border-border/60 bg-card shadow-sm h-32 animate-pulse">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-8 w-1/2 rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total Posts"
              value={stats?.totalPosts || 0}
              icon={<Calendar className="size-5" />}
              trend={{
                value: 4.8,
                isPositive: true,
                label: "all-time total volume",
              }}
            />
            <StatsCard
              title="Scheduled Posts"
              value={stats?.scheduledPosts || 0}
              icon={<Clock className="size-5" />}
              trend={{
                value: 2.1,
                isPositive: true,
                label: "queued for delivery",
              }}
            />
            <StatsCard
              title="Total Reach"
              value={stats ? stats.totalReach.toLocaleString() : 0}
              icon={<Eye className="size-5" />}
              trend={{
                value: 12.4,
                isPositive: true,
                label: getTrendLabel(),
              }}
            />
            <StatsCard
              title="Engagement Rate"
              value={stats ? `${stats.averageEngagementRate}%` : "0%"}
              icon={<Percent className="size-5" />}
              trend={{
                value: 1.2,
                isPositive: stats ? stats.averageEngagementRate > 4.5 : true,
                label: getTrendLabel(),
              }}
            />
          </>
        )}
      </div>

      {/* Visualizations Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading && !charts ? (
            <Card className="border border-border/60 bg-card shadow-sm h-[350px] animate-pulse">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <Skeleton className="h-6 w-1/4 rounded" />
                <Skeleton className="h-[250px] w-full rounded" />
              </CardContent>
            </Card>
          ) : (
            <PostsLineChart data={charts?.postsPerDay || []} />
          )}
        </div>

        <div className="lg:col-span-1">
          {loading && !charts ? (
            <Card className="border border-border/60 bg-card shadow-sm h-[350px] animate-pulse">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <Skeleton className="h-6 w-1/3 rounded" />
                <Skeleton className="h-[200px] w-full rounded-full" />
              </CardContent>
            </Card>
          ) : (
            <PlatformDonutChart data={charts?.postsByPlatform || []} />
          )}
        </div>
      </div>

      {/* Bar Chart section */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          {loading && !charts ? (
            <Card className="border border-border/60 bg-card shadow-sm h-[300px] animate-pulse">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <Skeleton className="h-6 w-1/3 rounded" />
                <Skeleton className="h-[200px] w-full rounded" />
              </CardContent>
            </Card>
          ) : (
            <PlatformBarChart data={charts?.engagementByPlatform || []} />
          )}
        </div>

        <div className="md:col-span-2">
          {/* Card containing engagement overview details */}
          <Card className="border border-border bg-card shadow-sm h-full flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  Key Insights
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Analyzing performance trends helps you identify which platforms are yielding the highest organic engagement rate. 
                </p>
                <div className="mt-4 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Top Channel:</span>
                    <span className="font-bold text-foreground">
                      {charts && charts.engagementByPlatform.length > 0
                        ? charts.engagementByPlatform.reduce((max, c) => c.engagementRate > max.engagementRate ? c : max).platform
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Average Audience Reach:</span>
                    <span className="font-bold text-foreground">
                      {stats && stats.totalPosts > 0
                        ? Math.round(stats.totalReach / (posts.length || 1)).toLocaleString()
                        : 0} per post
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Most Effective Engagement Strategy:</span>
                    <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">AI Automated Responses</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/60 text-xs text-muted-foreground/80 leading-relaxed mt-4">
                Tip: Maintain a consistent publishing schedule to optimize reach algorithms on Instagram and LinkedIn.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Posts Table Section */}
      <div>
        {loading && posts.length === 0 ? (
          <Card className="border border-border/60 bg-card shadow-sm h-[300px] animate-pulse">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </CardContent>
          </Card>
        ) : (
          <TopPostsTable posts={posts} />
        )}
      </div>
    </div>
  );
}
