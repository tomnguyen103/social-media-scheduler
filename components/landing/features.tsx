"use client";

import { Sparkles, Calendar, Bot, BarChart3, Image, Zap } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Composer",
    description: "Generate platform-optimized captions, hashtags, and creative variations with Gemini AI in a single click.",
    color: "from-indigo-500 to-purple-500",
    bgLight: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: Calendar,
    title: "Visual Content Calendar",
    description: "See all your scheduled posts in a beautiful interactive calendar. Drag, drop, and reschedule with ease.",
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    icon: Bot,
    title: "Auto-Reply Rules",
    description: "Set keyword triggers and let Gemini AI respond to comments automatically, maintaining 24/7 client engagement.",
    color: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track reach, engagement rate, impressions, and audience growth across all social platforms from a single page.",
    color: "from-rose-500 to-orange-500",
    bgLight: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    icon: Image,
    title: "Media Management",
    description: "Upload, store, transform, and crop images/videos securely via ImageKit's lightning-fast CDN.",
    color: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    icon: Zap,
    title: "Multi-Platform Publishing",
    description: "Compose once, customize character counts, and publish everywhere. Select your platforms and hit send.",
    color: "from-amber-500 to-indigo-500",
    bgLight: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 -z-10 bg-radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.05),transparent_50%)" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 md:mb-24">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Core Features
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Everything you need to grow your social audience
          </p>
          <p className="mt-5 text-lg text-muted-foreground">
            A complete suite of SaaS tools designed to simplify content creation, scheduling, and community interaction.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-border/40 bg-card p-8 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-lg dark:bg-card/40 backdrop-blur-xs"
            >
              {/* Card top border glow effect */}
              <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 from-indigo-500 to-purple-600" />
              
              {/* Icon */}
              <div className={`inline-flex size-12 items-center justify-center rounded-xl mb-6 transition-all duration-300 group-hover:scale-110 ${feature.bgLight}`}>
                <feature.icon className="size-6" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
