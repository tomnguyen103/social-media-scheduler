"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Founder, PeakCreative",
    handle: "@alexrivera",
    avatar: "AR",
    avatarColor: "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400",
    quote: "SocialCopilot cut our scheduling time in half. Being able to draft a post once and review the previews for Instagram, X, and LinkedIn side-by-side is a game-changer.",
  },
  {
    name: "Sarah Chen",
    role: "Social Lead, BloomTech",
    handle: "@sarahc_design",
    avatar: "SC",
    avatarColor: "bg-purple-600/10 text-purple-600 dark:text-purple-400",
    quote: "The Gemini AI auto-reply feature has been amazing for our comment sections. We get 24/7 engagement on our products without checking our phones every 10 minutes.",
  },
  {
    name: "Marcus Vance",
    role: "Growth Manager, SaaSFlow",
    handle: "@marcus_growth",
    avatar: "MV",
    avatarColor: "bg-pink-600/10 text-pink-600 dark:text-pink-400",
    quote: "The visual calendar interface makes content curation so intuitive. I can easily see if we have gaps in our postings and drag-and-drop drafts to schedule them instantly.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-muted/10 border-y border-border/40 relative">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Testimonials
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Trusted by creators & social teams
          </p>
          <p className="mt-5 text-lg text-muted-foreground">
            See how social managers, designers, and SaaS founders streamline their multi-platform publishing.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-6xl mx-auto">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-8 shadow-xs hover:border-indigo-500/20 transition-all duration-300"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-6 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-base italic leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 mt-8 border-t border-border/40 pt-4">
                <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${t.avatarColor}`}>
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight text-foreground">
                    {t.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
