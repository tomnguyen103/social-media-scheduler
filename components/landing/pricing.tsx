"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for personal branding or exploring the application.",
    features: [
      "3 connected accounts limit",
      "10 social posts per month",
      "Basic text-only scheduling",
      "Visual content calendar",
      "No AI composer support",
    ],
    ctaText: "Get Started",
    ctaLink: "/sign-up",
    featured: false,
  },
  {
    name: "Pro",
    price: "19",
    description: "Ideal for growing creators, builders, and active professionals.",
    features: [
      "10 connected accounts limit",
      "Unlimited social posts",
      "AI caption & hashtags (Gemini)",
      "Auto-reply rules & triggers",
      "Full analytics dashboard",
      "ImageKit media optimizer",
    ],
    ctaText: "Go Pro Now",
    ctaLink: "/sign-up",
    featured: true,
  },
  {
    name: "Agency",
    price: "49",
    description: "Built for scaling businesses, teams, and social managers.",
    features: [
      "Unlimited connected accounts",
      "Unlimited social posts",
      "All Gemini AI features",
      "Priority BullMQ queue processing",
      "Team collaboration slots",
      "24/7 dedicated email support",
    ],
    ctaText: "Contact Sales",
    ctaLink: "/sign-up",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28 relative">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Pricing Plans
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </p>
          <p className="mt-5 text-lg text-muted-foreground">
            Start free and scale as your audience grows. Choose the tier that best suits your scheduling and automation needs.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between rounded-2xl border bg-card p-8 shadow-xs relative ${
                plan.featured
                  ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/5 ring-1 ring-indigo-500 shadow-xl scale-105 z-10"
                  : "border-border/40 hover:border-indigo-500/20 transition-all duration-300"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  Popular ⭐
                </span>
              )}

              <div>
                {/* Plan Info */}
                <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>

                {/* Pricing amount */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                  <span className="text-sm font-semibold text-muted-foreground">/month</span>
                </div>

                <div className="h-px bg-border/40 my-6" />

                {/* Features list */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check className={`size-4 shrink-0 mt-0.5 ${plan.featured ? "text-indigo-500" : "text-muted-foreground"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Link href={plan.ctaLink}>
                  <Button
                    className={`w-full py-6 font-semibold shadow-md ${
                      plan.featured
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40"
                    }`}
                  >
                    {plan.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
