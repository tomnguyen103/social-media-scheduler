"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    value: "q1",
    question: "How many social media accounts can I connect?",
    answer: "Our Free plan supports up to 3 connected accounts. The Pro plan supports up to 10 connected accounts, and the Agency plan offers unlimited accounts. You can mix and match between any of our 9 supported platforms.",
  },
  {
    value: "q2",
    question: "What social platforms are supported?",
    answer: "We support 9 major platforms: Instagram, YouTube, TikTok, LinkedIn, Twitter/X, Facebook, Pinterest, Discord, and Slack. All support scheduling and direct publishing, and most support automated comment replying.",
  },
  {
    value: "q3",
    question: "How does the AI auto-reply feature work?",
    answer: "You define comment triggers (e.g. specific keywords like 'price' or 'link', or trigger on the first comment). Our background workers detect comments via webhooks/polling, and Gemini AI drafts a contextual, brand-aligned response to post automatically.",
  },
  {
    value: "q4",
    question: "Can I cancel or change my plan at any time?",
    answer: "Yes, you can manage your plan directly in your settings through Clerk Billing. You can upgrade, downgrade, or cancel at any time. When you upgrade, new account limits and features are available instantly.",
  },
  {
    value: "q5",
    question: "What are the limits of the Free plan?",
    answer: "The Free plan allows you to connect up to 3 social accounts and schedule/publish up to 10 posts per month. It includes the visual content calendar, but does not include Gemini AI caption generation, auto-reply rules, or analytics.",
  },
  {
    value: "q6",
    question: "Is my data and social account access secure?",
    answer: "Security is our top priority. We connect to your accounts using official OAuth protocols, meaning we never see or store your raw social media passwords. All access tokens are stored securely and encrypted at rest using AES-256.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-28 relative">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Support
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Frequently Asked Questions
          </p>
          <p className="mt-5 text-lg text-muted-foreground">
            Have questions about integrations, billing, or features? Find quick answers below.
          </p>
        </div>

        {/* FAQ Accordion container */}
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 md:p-10 shadow-xs dark:bg-card/30 backdrop-blur-xs">
          <Accordion defaultValue={["q1"]}>
            {faqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value} className="py-2 border-b border-border/40 last:border-0">
                <AccordionTrigger className="text-base font-semibold text-left py-4 hover:text-indigo-600 dark:hover:text-indigo-400 focus:underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
