"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 px-6 py-20 text-center shadow-2xl rounded-3xl sm:px-16">
          {/* Decorative radial glows */}
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle
              cx="512"
              cy="512"
              r="512"
              fill="url(#gradient-id)"
              fillOpacity="0.15"
            />
            <defs>
              <radialGradient id="gradient-id">
                <stop stopColor="#fff" />
                <stop offset="1" stopColor="#818cf8" />
              </radialGradient>
            </defs>
          </svg>

          {/* Heading */}
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Supercharge Your Social Growth Today
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
            Join thousands of creators and marketing teams who use SocialCopilot to save hours, write better copy, and engage 24/7.
          </p>

          {/* Button CTA */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-6 py-6 shadow-xl flex items-center gap-2 group"
              >
                <span>Get Started For Free</span>
                <ArrowRight className="size-4 text-indigo-900 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Sparkles visual */}
          <div className="absolute top-8 right-12 text-white/10 hidden md:block">
            <Sparkles className="size-16 animate-pulse" />
          </div>
          <div className="absolute bottom-8 left-12 text-white/10 hidden md:block">
            <Sparkles className="size-12 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
