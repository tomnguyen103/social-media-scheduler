"use client";

import { Link2, Sparkles, CalendarRange } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Connect Platforms",
    subtitle: "Integrate your socials in seconds",
    description: "Securely link your accounts (Instagram, LinkedIn, X, TikTok, etc.) through our automated server-side OAuth pipelines.",
    icon: Link2,
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    number: "02",
    title: "Compose & Optimize",
    subtitle: "Draft your posts with AI guidance",
    description: "Write your post once. Refine it using Gemini AI for descriptions and hashtags, then view how it displays on each social feed.",
    icon: Sparkles,
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    number: "03",
    title: "Schedule & Engage",
    subtitle: "Publish automatically on autopilot",
    description: "Pick your publication time using our visual scheduler. Set up auto-reply rules to instantly answer customer comments.",
    icon: CalendarRange,
    badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-muted/10 border-y border-border/40 relative">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 md:mb-24">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Simple Process
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get started in 3 easy steps
          </p>
          <p className="mt-5 text-lg text-muted-foreground">
            No complex setup. SocialCopilot connects directly with official APIs to publish and monitor your accounts smoothly.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid gap-12 lg:grid-cols-3 lg:gap-8">
          {/* Connector Line (Desktop only) */}
          <div className="absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hidden lg:block -z-10" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-6 bg-card dark:bg-card/30 rounded-2xl border border-border/40 shadow-xs relative">
              {/* Step Badge */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border bg-background px-4 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
                Step {step.number}
              </div>

              {/* Icon */}
              <div className={`mt-4 inline-flex size-14 items-center justify-center rounded-2xl border ${step.badgeColor} shadow-inner mb-6`}>
                <step.icon className="size-6" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {step.title}
              </h3>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mt-1 mb-3">
                {step.subtitle}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
