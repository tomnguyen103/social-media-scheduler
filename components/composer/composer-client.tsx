/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles,
  Smile,
  Upload,
  Calendar,
  Clock,
  Check,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Lock,
  Crop,
  Sparkle,
  Plus,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";

// Platform characteristics
interface PlatformDetail {
  name: string;
  icon: string;
  limit: number;
  color: string;
}

const PLATFORM_DETAILS: Record<string, PlatformDetail> = {
  instagram: { name: "Instagram", icon: "📸", limit: 2200, color: "bg-pink-600 text-white" },
  youtube: { name: "YouTube", icon: "▶️", limit: 5000, color: "bg-red-600 text-white" },
  tiktok: { name: "TikTok", icon: "🎵", limit: 2200, color: "bg-black border border-zinc-800 text-white" },
  facebook: { name: "Facebook", icon: "📘", limit: 5000, color: "bg-blue-600 text-white" },
  linkedin: { name: "LinkedIn", icon: "👔", limit: 3000, color: "bg-blue-700 text-white" },
  pinterest: { name: "Pinterest", icon: "📌", limit: 500, color: "bg-red-500 text-white" },
  discord: { name: "Discord", icon: "💬", limit: 2000, color: "bg-indigo-600 text-white" },
  twitter: { name: "Twitter/X", icon: "🐦", limit: 280, color: "bg-zinc-900 text-white" },
  slack: { name: "Slack", icon: "💼", limit: 4000, color: "bg-emerald-600 text-white" },
};

const COMMON_EMOJIS = [
  // Smileys
  "😀", "😂", "😍", "😎", "😊", "😉", "🤔", "🙄", "🥳", "😭", "😡", "😱",
  // Hand gestures
  "👍", "👎", "👊", "✌️", "🙌", "👏", "🙏", "💪", "👋", "✍️",
  // Fun / Visual
  "🔥", "🚀", "🎉", "✨", "🌟", "💯", "💡", "📢", "💬", "❤️", "🌈", "☀️",
  // Objects / Tech
  "📸", "🎥", "🎨", "💻", "📱", "🎮", "👔", "💼", "🐦", "📌", "🍕", "☕"
];

interface ConnectedAccount {
  id: string;
  platform: string;
  platformUserId: string;
  platformUsername: string;
}

interface UploadedFile {
  id: string;
  rawUrl: string;
  fileName: string;
  type: "image" | "video";
  autoCrop: boolean;
  removeBg: boolean;
}

interface ComposerClientProps {
  initialAccounts: ConnectedAccount[];
  plan: "free" | "pro" | "agency";
  limitInfo: {
    allowed: boolean;
    count: number;
    max: number;
  };
  initialPost?: {
    id: string;
    content: string;
    mediaUrls: string[];
    status: string;
    scheduledAt: string | null;
    platformAccountIds: string[];
  } | null;
}

export function ComposerClient({
  initialAccounts,
  plan,
  limitInfo,
  initialPost,
}: ComposerClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isProPlus = plan === "pro" || plan === "agency";
  const [showUpgradeReason, setShowUpgradeReason] = useState<"ai" | "posts" | null>(null);

  // Composer State
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPost?.platformAccountIds || []
  );
  const [content, setContent] = useState(initialPost?.content || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    if (initialPost?.mediaUrls) {
      return initialPost.mediaUrls.map((url, index) => {
        const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm|avi)/) !== null;
        const hasAutoCrop = url.includes("w-800,h-800,fo-auto");
        const hasRemoveBg = url.includes("bg-remove");
        
        let rawUrl = url;
        if (url.includes("?tr=") || url.includes("&tr=")) {
          rawUrl = url.split(/[?&]tr=/)[0];
        }

        return {
          id: `initial-${index}`,
          rawUrl,
          fileName: url.substring(url.lastIndexOf("/") + 1).split(/[?#]/)[0] || `media-${index}`,
          type: isVideo ? ("video" as const) : ("image" as const),
          autoCrop: hasAutoCrop,
          removeBg: hasRemoveBg,
        };
      });
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Scheduling State
  const [publishMode, setPublishMode] = useState<"now" | "schedule">(
    initialPost?.scheduledAt ? "schedule" : "now"
  );
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    if (initialPost?.scheduledAt) {
      // Format to YYYY-MM-DDTHH:MM local format
      const d = new Date(initialPost.scheduledAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
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

  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generation State
  const [aiTopic, setAiTopic] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;



  // Insert Emoji at Cursor Position
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setContent(before + emoji + after);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Upload to ImageKit
  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    const uploadPromises = files.map(async (file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported image or video format.`);
        return;
      }

      try {
        // 1. Get signed params
        const authRes = await fetch("/api/media/upload", { method: "POST" });
        if (!authRes.ok) throw new Error("Authentication failed");
        const authData = await authRes.json();

        // 2. Upload to ImageKit via XHR to monitor progress
        return new Promise<void>((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", file.name);
          formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
          formData.append("signature", authData.signature);
          formData.append("expire", authData.expire.toString());
          formData.append("token", authData.token);
          formData.append("useUniqueFileName", "true");

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload", true);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              const newFile: UploadedFile = {
                id: response.fileId,
                rawUrl: response.url,
                fileName: file.name,
                type: isVideo ? "video" : "image",
                autoCrop: false,
                removeBg: false,
              };
              setUploadedFiles((prev) => [...prev, newFile]);
              toast.success(`${file.name} uploaded successfully.`);
              resolve();
            } else {
              reject(new Error(xhr.responseText));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      } catch (err) {
        console.error("Upload failed for:", file.name, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    });

    try {
      await Promise.all(uploadPromises);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleAutoCrop = (id: string) => {
    if (!isProPlus) {
      setShowUpgradeReason("ai");
      return;
    }
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, autoCrop: !f.autoCrop } : f))
    );
  };

  const toggleRemoveBg = (id: string) => {
    if (!isProPlus) {
      setShowUpgradeReason("ai");
      return;
    }
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, removeBg: !f.removeBg } : f))
    );
  };

  // Compile final ImageKit URLs including transformations
  const getTransformedUrl = (file: UploadedFile) => {
    if (file.type === "video") return file.rawUrl;

    const trParams: string[] = [];
    if (file.autoCrop) {
      trParams.push("w-800,h-800,fo-auto");
    }
    if (file.removeBg) {
      trParams.push("bg-remove");
    }

    if (trParams.length === 0) return file.rawUrl;

    const separator = file.rawUrl.includes("?") ? "&" : "?";
    return `${file.rawUrl}${separator}tr=${trParams.join(",")}`;
  };

  // Platform Selector Toggle
  const togglePlatform = (accountId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  // AI Caption Streaming Generator
  const generateAiCaption = async () => {
    if (!isProPlus) {
      setShowUpgradeReason("ai");
      return;
    }
    if (!aiTopic) {
      toast.error("Please enter a topic or topic idea first.");
      return;
    }

    setIsGeneratingCaption(true);
    setContent("");

    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, context: aiContext }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate caption");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          textBuffer += chunk;
          setContent(textBuffer);
        }
      }
      toast.success("AI Caption generated!");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to stream caption.";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // AI Hashtag Appender
  const generateAiHashtags = async () => {
    if (!isProPlus) {
      setShowUpgradeReason("ai");
      return;
    }
    if (!content && !aiTopic) {
      toast.error("Please provide some post content or a topic to generate hashtags.");
      return;
    }

    setIsGeneratingHashtags(true);
    try {
      const response = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topic: aiTopic }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate hashtags");
      }

      const data = await response.json();
      if (data.hashtags) {
        setContent((prev) => (prev ? `${prev}\n\n${data.hashtags}` : data.hashtags));
        toast.success("Hashtags appended!");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate hashtags.";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  // Submit Handler (Save Draft, Schedule, Publish Now)
  const handleSubmit = async (submitStatus: "draft" | "scheduled" | "published") => {
    // Basic checks
    if (!content && uploadedFiles.length === 0) {
      toast.error("Post cannot be empty. Enter content or upload media.");
      return;
    }

    if (submitStatus !== "draft" && selectedPlatforms.length === 0) {
      toast.error("Select at least one social account to publish/schedule.");
      return;
    }

    // Check month limits for Free users
    if (
      submitStatus !== "draft" &&
      !limitInfo.allowed &&
      !initialPost // If editing, we allow updating
    ) {
      setShowUpgradeReason("posts");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare media urls with transformations
      const mediaUrls = uploadedFiles.map((file) => getTransformedUrl(file));

      // 2. Calculate UTC time for scheduling
      let targetScheduledAtISO: string | null = null;
      if (submitStatus === "scheduled" && publishMode === "schedule") {
        const localDate = fromZonedTime(scheduledAt, userTimeZone);
        targetScheduledAtISO = localDate.toISOString();
      }

      const body = {
        content,
        mediaUrls,
        status: submitStatus,
        scheduledAt: targetScheduledAtISO,
        platformAccountIds: selectedPlatforms,
      };

      const isEditing = !!initialPost;
      const url = isEditing ? `/api/posts/${initialPost.id}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong saving the post");
      }

      toast.success(
        submitStatus === "draft"
          ? "Post saved as draft!"
          : submitStatus === "published"
            ? "Post published successfully!"
            : "Post scheduled successfully!"
      );

      router.push("/dashboard/calendar");
      router.refresh();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit post.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check character limits and warnings
  const getCharacterLimitStatus = (platformKey: string) => {
    const details = PLATFORM_DETAILS[platformKey];
    if (!details) return null;
    const length = content.length;
    const limit = details.limit;
    return {
      length,
      limit,
      isOver: length > limit,
      percent: Math.min((length / limit) * 100, 100),
    };
  };

  // Filter selected connected accounts details
  const activeConnectedAccounts = initialAccounts.filter((acc) =>
    selectedPlatforms.includes(acc.id)
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header Info */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Post Composer</h2>
          <p className="text-sm text-muted-foreground">
            Write, optimize, preview and schedule content across all your active networks.
          </p>
        </div>

        {plan === "free" && (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-amber-500 max-w-xs flex gap-2">
            <Info className="size-4 shrink-0" />
            <div>
              <span className="font-semibold">Free Plan Usage:</span> {limitInfo.count} /{" "}
              {limitInfo.max} posts this month. Upgrade to Pro for unlimited scheduling and Gemini AI
              features.
            </div>
          </div>
        )}
      </div>

      {initialAccounts.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plus className="size-6" />
            </div>
            <CardTitle className="mt-4 text-lg font-semibold">No social accounts connected</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-6">
              You must link at least one social media account before you can compose and schedule posts.
            </p>
            <Button onClick={() => router.push("/accounts")} className="w-full">
              Go to Connected Accounts <ExternalLink className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Editor Controls */}
          <div className="space-y-6 lg:col-span-7">
            {/* 1. SELECT PLATFORMS */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Target Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2.5">
                  {initialAccounts.map((account) => {
                    const isSelected = selectedPlatforms.includes(account.id);
                    const details = PLATFORM_DETAILS[account.platform] || {
                      name: account.platform,
                      icon: "🔗",
                      color: "bg-zinc-600 text-white",
                    };
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => togglePlatform(account.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition duration-150 ${
                          isSelected
                            ? `${details.color} border-transparent shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)] scale-102`
                            : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <span className="text-sm">{details.icon}</span>
                        <span>
                          {details.name} ({account.platformUsername})
                        </span>
                        {isSelected && <Check className="ml-0.5 size-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 2. CONTENT EDITOR */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Compose Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0 transition duration-150">
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something engaging..."
                    className="min-h-[160px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 resize-y font-normal leading-relaxed text-sm bg-transparent"
                  />

                  {/* Character limits drawer at the bottom of the editor */}
                  {selectedPlatforms.length > 0 && (
                    <div className="border-t border-border/40 px-3.5 py-2 flex flex-wrap gap-x-4 gap-y-1.5 bg-muted/20 rounded-b-xl text-[11px] font-medium text-muted-foreground">
                      {activeConnectedAccounts.map((acc) => {
                        const status = getCharacterLimitStatus(acc.platform);
                        if (!status) return null;
                        const details = PLATFORM_DETAILS[acc.platform];
                        return (
                          <div
                            key={acc.id}
                            className={`flex items-center gap-1 ${
                              status.isOver ? "text-destructive font-bold" : ""
                            }`}
                          >
                            <span>{details.icon}</span>
                            <span className="capitalize">{details.name}:</span>
                            <span>
                              {status.length} / {status.limit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Editor Actions: Emoji, AI and character status */}
                <div className="flex flex-wrap gap-2.5 items-center justify-between">
                  <div className="flex gap-2">
                    {/* Native Emoji Picker */}
                    <Popover>
                      <PopoverTrigger
                        render={<Button variant="outline" size="sm" className="rounded-xl h-9" />}
                      >
                        <Smile className="size-4 mr-1.5 text-muted-foreground" /> Emojis
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[280px] p-2 bg-popover border border-border shadow-lg rounded-xl">
                        <ScrollArea className="h-[200px]">
                          <div className="grid grid-cols-6 gap-1 p-1">
                            {COMMON_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => insertEmoji(emoji)}
                                className="flex size-9 items-center justify-center rounded-lg text-lg hover:bg-muted transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>

                    {/* AI Prompting */}
                    {!isProPlus ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-9 relative opacity-75 border-border hover:bg-muted/50"
                        onClick={() => setShowUpgradeReason("ai")}
                      >
                        <Sparkles className="size-4 mr-1.5 text-primary" />
                        <span className="text-primary font-semibold">✨ AI Assistant</span>
                        <Lock className="size-3 ml-1 text-muted-foreground shrink-0" />
                      </Button>
                    ) : (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl h-9 relative hover:bg-primary/5 border-primary/30"
                            />
                          }
                        >
                          <Sparkles className="size-4 mr-1.5 text-primary" />
                          <span className="text-primary font-semibold">✨ AI Assistant</span>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-4 bg-popover border border-border shadow-lg rounded-xl space-y-4">
                          <div className="space-y-3">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                              Gemini AI Assistant
                            </h4>
                            <div className="space-y-2">
                              <label className="text-[11px] font-semibold text-foreground">Topic or Idea</label>
                              <input
                                type="text"
                                placeholder="E.g. launch of our summer shoe collection..."
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="w-full rounded-lg border border-input px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-semibold text-foreground">
                                Tone Details & Context (Optional)
                              </label>
                              <textarea
                                placeholder="E.g. professional, excited, keep it short..."
                                value={aiContext}
                                onChange={(e) => setAiContext(e.target.value)}
                                className="w-full rounded-lg border border-input px-3 py-1.5 text-xs h-16 focus:ring-1 focus:ring-primary outline-none resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button
                                size="sm"
                                disabled={isGeneratingCaption || isGeneratingHashtags}
                                onClick={generateAiCaption}
                                className="rounded-lg text-xs"
                              >
                                {isGeneratingCaption ? (
                                  <>
                                    <Loader2 className="size-3.5 animate-spin mr-1" /> Generating...
                                  </>
                                ) : (
                                  "Create Caption"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isGeneratingCaption || isGeneratingHashtags}
                                onClick={generateAiHashtags}
                                className="rounded-lg text-xs"
                              >
                                {isGeneratingHashtags ? (
                                  <>
                                    <Loader2 className="size-3.5 animate-spin mr-1" /> Loading...
                                  </>
                                ) : (
                                  "Get Hashtags"
                                )}
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg">
                    Total: {content.length} chars
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. MEDIA UPLOAD */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Media Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, video/mp4"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                    <Upload className="size-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">Drag & drop files here</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PNG, JPG, WebP images, or MP4 videos
                  </p>
                </div>

                {/* Uploading Progress */}
                {isUploading && Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2.5 rounded-xl border border-border/40 bg-muted/10 p-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Uploading media...
                    </h5>
                    {Object.entries(uploadProgress).map(([fileName, percent]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-foreground">
                          <span className="truncate max-w-[200px]">{fileName}</span>
                          <span>{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Files Grid & AI Transformations */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {uploadedFiles.map((file) => {
                      const finalUrl = getTransformedUrl(file);
                      return (
                        <div
                          key={file.id}
                          className="group relative rounded-xl border border-border/60 bg-card p-3 flex flex-col gap-3.5 hover:shadow-md transition duration-150"
                        >
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="absolute top-2 right-2 z-10 size-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-destructive transition duration-150"
                            title="Remove attachment"
                          >
                            <Trash2 className="size-3.5" />
                          </button>

                          {/* Media Thumbnail Container */}
                          <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                            {file.type === "video" ? (
                              <>
                                <video src={finalUrl} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <VideoIcon className="size-8 text-white/80" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={finalUrl}
                                alt={file.fileName}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Controls (AI transformations) for Pro users */}
                          {file.type === "image" && (
                            <div className="space-y-2.5 border-t border-border/40 pt-2.5">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  ⚡ AI Transformations
                                  {!isProPlus && <Lock className="size-3" />}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAutoCrop(file.id)}
                                  className={`h-8 flex-1 text-xs gap-1.5 rounded-lg border ${
                                    file.autoCrop
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "border-border text-muted-foreground bg-transparent"
                                  } ${!isProPlus ? "opacity-60 cursor-not-allowed hover:bg-transparent" : ""}`}
                                  type="button"
                                >
                                  <Crop className="size-3.5" /> Auto-Crop
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleRemoveBg(file.id)}
                                  className={`h-8 flex-1 text-xs gap-1.5 rounded-lg border ${
                                    file.removeBg
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "border-border text-muted-foreground bg-transparent"
                                  } ${!isProPlus ? "opacity-60 cursor-not-allowed hover:bg-transparent" : ""}`}
                                  type="button"
                                >
                                  <Sparkle className="size-3.5" /> Remove BG
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground truncate w-full">
                            {file.fileName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. SCHEDULING */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Publishing Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 p-1 bg-muted/30 border border-border/40 rounded-xl max-w-sm">
                  <button
                    type="button"
                    onClick={() => setPublishMode("now")}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${
                      publishMode === "now"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Publish Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishMode("schedule")}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${
                      publishMode === "schedule"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>

                {publishMode === "schedule" && (
                  <div className="space-y-3.5 max-w-md">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5" /> Pick Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="rounded-xl border border-input px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none w-full bg-card"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/20 px-3 py-2 rounded-lg">
                      <Clock className="size-3.5 shrink-0" /> Local Timezone detected:{" "}
                      <span className="font-semibold text-foreground">{userTimeZone}</span>. Post will
                      automatically be converted to UTC in the database.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BUTTON BAR */}
            <div className="flex flex-wrap gap-3.5 justify-end">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSubmit("draft")}
                className="rounded-xl h-11 px-6 font-semibold"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                Save Draft
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() =>
                  handleSubmit(publishMode === "now" ? "published" : "scheduled")
                }
                className="rounded-xl h-11 px-6 font-semibold shadow-[0_8px_20px_-6px_oklch(0.6_0.27_296_/_0.3)] bg-primary text-primary-foreground hover:bg-primary/95 transition duration-150"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                {publishMode === "now" ? "Publish Post Now" : "Schedule Post"}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Previews */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Real-Time Preview Panel
              </h3>

              {selectedPlatforms.length === 0 ? (
                <Card className="border border-dashed py-16 text-center shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                      <ImageIcon className="size-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">No platforms selected</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
                      Select one or more target platform chips on the left to see live previews of your post.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
                  {activeConnectedAccounts.map((account) => {
                    const previewFile = uploadedFiles[0]; // Renders first file in preview
                    const fileUrl = previewFile ? getTransformedUrl(previewFile) : null;
                    const details = PLATFORM_DETAILS[account.platform];

                    // Render Preview depending on platform
                    if (account.platform === "instagram") {
                      return (
                        <Card
                          key={account.id}
                          className="border border-border/40 shadow-sm overflow-hidden"
                        >
                          <div className="border-b border-border/40 bg-muted/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                            <span>📸</span> {details.name} Preview
                          </div>
                          <CardContent className="p-4">
                            {/* Instagram Header */}
                            <div className="flex items-center gap-2.5 mb-3">
                              <Avatar className="size-8 border border-border">
                                <AvatarImage src={user?.imageUrl} />
                                <AvatarFallback className="bg-pink-100 text-pink-700 text-xs font-semibold">
                                  {user?.firstName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold leading-none">
                                  {account.platformUsername}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  Sponsored
                                </span>
                              </div>
                            </div>

                            {/* Instagram Media Container */}
                            {fileUrl ? (
                              <div className="aspect-square w-full rounded-lg bg-black overflow-hidden flex items-center justify-center border border-border/40">
                                {previewFile.type === "video" ? (
                                  <video src={fileUrl} className="w-full h-full object-cover" controls muted />
                                ) : (
                                  <img src={fileUrl} className="w-full h-full object-cover" alt="Preview" />
                                )}
                              </div>
                            ) : (
                              <div className="aspect-square w-full rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border text-xs gap-1.5">
                                <ImageIcon className="size-6 opacity-60" />
                                <span>No Media Selected</span>
                              </div>
                            )}

                            {/* Instagram Footer */}
                            <div className="mt-3.5 space-y-1">
                              <span className="text-xs font-bold mr-1.5">{account.platformUsername}</span>
                              <span className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {content || "Type content on the left to see preview..."}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (account.platform === "twitter") {
                      return (
                        <Card
                          key={account.id}
                          className="border border-border/40 shadow-sm"
                        >
                          <div className="border-b border-border/40 bg-muted/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                            <span>🐦</span> Twitter / X Preview
                          </div>
                          <CardContent className="p-4 flex gap-3">
                            <Avatar className="size-9 border border-border shrink-0">
                              <AvatarImage src={user?.imageUrl} />
                              <AvatarFallback className="bg-zinc-100 text-zinc-800 text-xs font-semibold">
                                {user?.firstName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Header */}
                              <div className="flex items-center gap-1 text-xs">
                                <span className="font-bold text-foreground leading-tight truncate max-w-[150px]">
                                  {user?.fullName || "Your Name"}
                                </span>
                                <span className="text-muted-foreground truncate">
                                  @{account.platformUsername}
                                </span>
                                <span className="text-muted-foreground shrink-0">· now</span>
                              </div>

                              {/* Content */}
                              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                                {content || "Type content on the left to see preview..."}
                              </div>

                              {/* Media */}
                              {fileUrl && (
                                <div className="aspect-video w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-border/40">
                                  {previewFile.type === "video" ? (
                                    <video src={fileUrl} className="w-full h-full object-cover" controls muted />
                                  ) : (
                                    <img src={fileUrl} className="w-full h-full object-cover" alt="Preview" />
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (account.platform === "linkedin") {
                      return (
                        <Card
                          key={account.id}
                          className="border border-border/40 shadow-sm"
                        >
                          <div className="border-b border-border/40 bg-muted/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                            <span>👔</span> LinkedIn Preview
                          </div>
                          <CardContent className="p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-9 border border-border">
                                <AvatarImage src={user?.imageUrl} />
                                <AvatarFallback className="bg-blue-50 text-blue-800 text-xs font-semibold">
                                  {user?.firstName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold leading-none truncate">
                                  {user?.fullName || account.platformUsername}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate mt-1">
                                  Professional Account · Just now
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                              {content || "Type content on the left to see preview..."}
                            </div>

                            {/* Media */}
                            {fileUrl && (
                              <div className="aspect-video w-full bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center border border-border/40">
                                {previewFile.type === "video" ? (
                                  <video src={fileUrl} className="w-full h-full object-cover" controls muted />
                                ) : (
                                  <img src={fileUrl} className="w-full h-full object-cover" alt="Preview" />
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }

                    // Fallback for other platforms
                    return (
                      <Card
                        key={account.id}
                        className="border border-border/40 shadow-sm"
                      >
                        <div className="border-b border-border/40 bg-muted/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                          <span>{details.icon}</span> {details.name} Preview
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <span>{details.icon}</span>
                            <span>{account.platformUsername}</span>
                          </div>
                          <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {content || "Type content on the left to see preview..."}
                          </div>
                          {fileUrl && (
                            <div className="aspect-video w-full rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center border border-border/40">
                              {previewFile.type === "video" ? (
                                <video src={fileUrl} className="w-full h-full object-cover" controls muted />
                              ) : (
                                <img src={fileUrl} className="w-full h-full object-cover" alt="Preview" />
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Dialog Modals */}
      <UpgradeModal
        isOpen={showUpgradeReason !== null}
        onClose={() => setShowUpgradeReason(null)}
        reason={showUpgradeReason || "ai"}
        limit={limitInfo.max}
      />
    </div>
  );
}
