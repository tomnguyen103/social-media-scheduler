import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem("theme") === "light" ? "light" : "dark";
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: "Social Copilot - Multi-Platform Social Media Scheduler & AI Manager",
    template: "%s | Social Copilot",
  },
  description: "Create, plan, schedule, and auto-reply to social posts across 9 social networks simultaneously, powered by Gemini AI workflows.",
  metadataBase: new URL("https://socialcopilot.com"),
  keywords: [
    "social media scheduler", 
    "AI post composer", 
    "auto-reply chatbot", 
    "content calendar", 
    "marketing automation", 
    "Instagram scheduling", 
    "LinkedIn automation", 
    "TikTok manager"
  ],
  authors: [{ name: "Social Copilot Team" }],
  creator: "Social Copilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://socialcopilot.com",
    title: "Social Copilot - Multi-Platform Social Media Scheduler & AI Manager",
    description: "Compose once, publish everywhere. Automate scheduling and comment moderation across 9 platforms with advanced AI.",
    siteName: "Social Copilot",
    images: [
      {
        url: "https://socialcopilot.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Social Copilot Dashboard Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Copilot - Multi-Platform Social Media Scheduler & AI Manager",
    description: "Compose once, publish everywhere. Automate scheduling and comment moderation across 9 platforms with advanced AI.",
    images: ["https://socialcopilot.com/og-image.jpg"],
    creator: "@socialcopilot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ThemeProvider>
            {children}
            <Toaster position="bottom-right" closeButton richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
