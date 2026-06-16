"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostItem {
  id: string;
  content: string;
  mediaUrls: string[];
  publishedAt: string | Date;
  platforms: string[];
  reach: number;
  engagement: number;
  engagementRate: number;
}

interface TopPostsTableProps {
  posts: PostItem[];
}

type SortField = "reach" | "engagement";
type SortDirection = "asc" | "desc";

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  facebook: "📘",
  twitter: "🐦",
  linkedin: "👔",
  youtube: "▶️",
  tiktok: "🎵",
  discord: "💬",
  slack: "💬",
  pinterest: "📌"
};

export function TopPostsTable({ posts }: TopPostsTableProps) {
  const [sortField, setSortField] = useState<SortField>("reach");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const formatDate = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Top Performing Posts</CardTitle>
        <CardDescription>Analyze individual post performance and engagement metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
            <Share2 className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold">No posts in this period</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Once you publish posts and they accumulate stats, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Media</TableHead>
                  <TableHead className="min-w-[200px]">Content</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("reach")}
                      className="h-8 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      Reach
                      <ArrowUpDown className="ml-1.5 size-3 shrink-0" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("engagement")}
                      className="h-8 px-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      Engagement
                      <ArrowUpDown className="ml-1.5 size-3 shrink-0" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPosts.map((post) => (
                  <TableRow key={post.id} className="hover:bg-muted/30">
                    <TableCell>
                      {post.mediaUrls && post.mediaUrls.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={post.mediaUrls[0]} 
                          alt="post thumbnail" 
                          className="h-10 w-10 rounded-lg object-cover border border-border/80 shadow-sm shrink-0" 
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border/60 text-muted-foreground shrink-0 shadow-sm">
                          <FileText className="size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate font-medium text-foreground">
                      {post.content}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {post.platforms.map((platform, idx) => (
                          <span 
                            key={idx} 
                            title={platform}
                            className="inline-flex size-6 items-center justify-center rounded-md bg-muted border border-border/60 text-xs shadow-sm"
                          >
                            {PLATFORM_ICONS[platform.toLowerCase()] || "📸"}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {post.reach.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {post.engagement.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-500 px-4 text-xs bg-emerald-500/5 rounded-md py-1">
                      {post.engagementRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
