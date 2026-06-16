"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  Calendar,
  Clock,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PLATFORM_ICONS } from "./post-chip";

interface PostDetailPanelProps {
  post: {
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onPostDeleted: (postId: string) => void;
  onPostUpdated: (updatedPost: NonNullable<PostDetailPanelProps["post"]>) => void;
}

export function PostDetailPanel({
  post,
  isOpen,
  onClose,
  onPostDeleted,
  onPostUpdated,
}: PostDetailPanelProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Rescheduling state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [newDateTime, setNewDateTime] = useState(() => {
    if (post?.scheduledAt) {
      // Convert UTC to local input format
      const dateLocal = toZonedTime(new Date(post.scheduledAt), userTimeZone);
      const year = dateLocal.getFullYear();
      const month = String(dateLocal.getMonth() + 1).padStart(2, "0");
      const day = String(dateLocal.getDate()).padStart(2, "0");
      const hours = String(dateLocal.getHours()).padStart(2, "0");
      const minutes = String(dateLocal.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T10:00`;
  });

  if (!post) return null;

  // Format main post date
  const displayDate = post.scheduledAt
    ? format(new Date(post.scheduledAt), "PPP p")
    : post.publishedAt
      ? format(new Date(post.publishedAt), "PPP p")
      : format(new Date(post.createdAt), "PPP p");

  const dateLabel = post.status === "scheduled"
    ? "Scheduled"
    : post.status === "published"
      ? "Published"
      : "Created";

  // Handle Delete Action
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete post");
      }
      toast.success("Post deleted successfully");
      onPostDeleted(post.id);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle Reschedule Action
  const handleReschedule = async () => {
    if (!newDateTime) {
      toast.error("Please select a date and time");
      return;
    }

    setIsSavingReschedule(true);
    try {
      const localDate = fromZonedTime(newDateTime, userTimeZone);
      const scheduledAtISO = localDate.toISOString();

      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: scheduledAtISO,
          status: "scheduled",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reschedule post");
      }

      const data = await res.json();
      toast.success("Post rescheduled successfully");
      setIsRescheduling(false);
      onPostUpdated(data.post);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to reschedule post");
    } finally {
      setIsSavingReschedule(false);
    }
  };

  // Status icon component
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="size-4 text-rose-500" />;
      case "pending":
        return <Loader2 className="size-4 text-blue-500 animate-spin" />;
      default:
        return <HelpCircle className="size-4 text-zinc-400" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90vw] sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border/40">
          <SheetTitle className="text-lg font-bold">Post Details</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            View status, details and manage scheduling for this post.
          </SheetDescription>
        </SheetHeader>

        {/* Details Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post Date Status */}
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="font-semibold text-muted-foreground mr-1">
                {dateLabel}:
              </span>
              <span className="font-medium text-foreground">{displayDate}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "capitalize font-bold text-[10px] tracking-wide",
                post.status === "scheduled" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                post.status === "published" && "bg-emerald-500/10 text-emerald-600 border-emerald-200",
                post.status === "draft" && "bg-zinc-500/10 text-zinc-600 border-zinc-200",
                (post.status === "failed" || post.status === "partial_failure") && "bg-rose-500/10 text-rose-600 border-rose-200"
              )}
            >
              {post.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Caption Content
            </h4>
            <div className="rounded-xl border border-border/40 bg-card p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {post.content || <span className="italic text-muted-foreground">No content caption.</span>}
            </div>
          </div>

          {/* Media Attachments */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Media ({post.mediaUrls.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {post.mediaUrls.map((url, index) => {
                  const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|avi)/) !== null;
                  return (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-muted/30 flex items-center justify-center"
                    >
                      {isVideo ? (
                        <video src={url} className="h-full w-full object-cover" preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`attachment-${index}`} className="h-full w-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Platforms status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Publish Status per Platform
            </h4>
            <div className="space-y-2">
              {post.targets.length === 0 ? (
                <div className="text-xs italic text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                  No targets selected. Post is saved as draft.
                </div>
              ) : (
                post.targets.map((target) => {
                  const platformIcon = PLATFORM_ICONS[target.platform] || "🔗";
                  return (
                    <div
                      key={target.id}
                      className="flex flex-col rounded-xl border border-border/40 p-3 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{platformIcon}</span>
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {target.platform}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({target.platformUsername})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(target.status)}
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              target.status === "published" && "text-emerald-500",
                              target.status === "failed" && "text-rose-500",
                              target.status === "pending" && "text-blue-500"
                            )}
                          >
                            {target.status}
                          </span>
                        </div>
                      </div>
                      {target.errorMessage && (
                        <div className="mt-2 text-[11px] text-rose-500 bg-rose-500/5 rounded p-2 font-medium border border-rose-500/10">
                          Error: {target.errorMessage}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reschedule Inline Panel */}
          {isRescheduling && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Clock className="size-3.5" /> Set New Schedule Time
              </h4>
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="bg-background"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRescheduling(false)}
                    disabled={isSavingReschedule}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReschedule}
                    disabled={isSavingReschedule}
                  >
                    {isSavingReschedule ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1" /> Saving...
                      </>
                    ) : (
                      "Apply Date"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 bg-muted/20 border-t border-border/40 flex flex-row items-center gap-2">
          {showDeleteConfirm ? (
            <div className="flex w-full items-center justify-between gap-4 bg-destructive/5 border border-destructive/20 p-2 rounded-xl">
              <span className="text-xs font-semibold text-destructive px-2">Are you sure?</span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  No
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive gap-1.5 font-medium shrink-0 cursor-pointer"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
              
              <div className="flex-1" />

              {!isRescheduling && post.status !== "published" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-medium cursor-pointer"
                  onClick={() => setIsRescheduling(true)}
                >
                  <Clock className="size-4" /> Reschedule
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                className="gap-1.5 font-medium cursor-pointer"
                onClick={() => {
                  router.push(`/composer?id=${post.id}`);
                  onClose();
                }}
              >
                <Edit className="size-4" /> Edit Post
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
