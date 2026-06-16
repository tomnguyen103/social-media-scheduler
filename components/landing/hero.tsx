"use client";

import Link from "next/link";
import { Play, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute top-20 right-[10%] -z-10 size-[350px] rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-10 left-[10%] -z-10 size-[350px] rounded-full bg-purple-500/10 blur-[80px] dark:bg-purple-500/5 animate-pulse duration-[8000ms]" />

      <div className="mx-auto max-w-7xl px-6 text-center">
        {/* Banner Badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 backdrop-blur-sm">
          <Sparkles className="size-3.5 animate-spin duration-[3000ms]" />
          <span>Now supporting 9 platforms simultaneously</span>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Manage All Your{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Social Media
          </span>{" "}
          in One Place
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          Create, schedule, and publish content across Instagram, YouTube, TikTok, LinkedIn and more — powered by Gemini AI and automated workflows.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="h-12 bg-indigo-600 px-6 text-base font-semibold text-white hover:bg-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.3)]">
              Start for Free
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>

          {/* Watch Demo Modal */}
          <Dialog>
            <DialogTrigger
              render={
                <Button size="lg" variant="outline" className="h-12 border-border/40 px-6 text-base font-semibold backdrop-blur-xs">
                  <Play className="mr-2 size-4 fill-current text-indigo-600 dark:text-indigo-400" />
                  Watch Demo
                </Button>
              }
            />
            <DialogContent className="sm:max-w-3xl border border-border/40 bg-background/95 p-6 shadow-2xl backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">SocialCopilot Demo Walkthrough</DialogTitle>
                <DialogDescription>
                  See how you can draft, optimize, and schedule a single post to 9 platforms in under 60 seconds.
                </DialogDescription>
              </DialogHeader>
              <div className="relative mt-4 aspect-video overflow-hidden rounded-lg border border-border/40 bg-zinc-950 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 via-transparent to-purple-950/20" />
                
                {/* Mock Video UI */}
                <div className="z-10 flex flex-col items-center gap-3 text-center p-6">
                  <div className="flex size-14 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-lg backdrop-blur-xs">
                    <Play className="size-6 fill-current translate-x-0.5" />
                  </div>
                  <span className="text-sm font-medium text-white/95">Previewing SocialCopilot Dashboard Flow</span>
                  <span className="text-xs text-white/60 max-w-sm">
                    In a production environment, this embeds your product video. Enjoy our interactive dashboard mock below!
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mockup Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl rounded-2xl border border-border/40 bg-card/60 p-4 shadow-2xl dark:bg-card/30 backdrop-blur-md">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />
          
          {/* Header bar of mockup */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-red-500/80" />
              <span className="size-3 rounded-full bg-yellow-500/80" />
              <span className="size-3 rounded-full bg-green-500/80" />
            </div>
            <div className="hidden sm:block rounded-md bg-muted px-16 py-1 text-xs text-muted-foreground border border-border/20">
              socialcopilot.com/dashboard/composer
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500">
              <Sparkles className="size-3.5" />
              <span>AI Mode Active</span>
            </div>
          </div>

          {/* Grid layout inside mockup */}
          <div className="grid gap-4 md:grid-cols-3 text-left">
            {/* Left Col: Composer Input */}
            <div className="md:col-span-2 space-y-4 rounded-xl border border-border/30 bg-background/50 p-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Social Networks</span>
                <div className="flex flex-wrap gap-2">
                  {["📸 Instagram", "🐦 Twitter/X", "👔 LinkedIn", "🎵 TikTok", "▶️ YouTube"].map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      <CheckCircle className="size-3 text-indigo-600 dark:text-indigo-400 fill-current" />
                      {p}
                    </span>
                  ))}
                  <span className="inline-flex items-center rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    +4 more
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft & Refine</span>
                <div className="rounded-lg border bg-card p-3 text-sm text-foreground/90 font-mono min-h-[100px] flex flex-col justify-between">
                  <span>Launching SocialCopilot Phase 2 today! 🚀 A beautiful, unified dashboard with full auto-reply rules and content calendar. Optimize your scheduling pipelines with Gemini AI. Link in bio! #SaaS #BuildInPublic</span>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                    <span className="text-xs text-indigo-500 flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Rewrite Caption
                    </span>
                    <span className="text-xs text-muted-foreground">176 / 280 chars</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Live Preview */}
            <div className="rounded-xl border border-border/30 bg-background/50 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Live Feed Preview</span>
                <div className="rounded-lg border bg-card p-3 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600" />
                    <div>
                      <div className="text-xs font-bold">yourbrand</div>
                      <div className="text-[10px] text-muted-foreground">Instagram · Preview</div>
                    </div>
                  </div>
                  <div className="aspect-video rounded bg-muted/60 flex items-center justify-center text-xs text-muted-foreground font-mono">
                    [ Media Placeholder ]
                  </div>
                  <p className="mt-2 text-xs text-foreground/85 line-clamp-2">
                    Launching SocialCopilot Phase 2 today! 🚀 A beautiful, unified dashboard with...
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  Ready to post
                </span>
                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-500 text-xs">
                  Publish Everywhere
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
