import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { PlatformMarquee } from "@/components/landing/marquee";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Scale Your Audience with Multi-Platform Scheduling",
  description: "Link up to 9 social profiles, compose posts once, and distribute instantly. Leverage Gemini AI to write custom captions and auto-reply rules for comment threads.",
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PlatformMarquee />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
