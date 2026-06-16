"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const platformDetails: Record<
  string,
  { name: string; icon: string; bg: string; scopes: string[] }
> = {
  instagram: {
    name: "Instagram",
    icon: "📸",
    bg: "from-purple-600 to-pink-500",
    scopes: ["instagram_basic", "instagram_content_publish", "pages_read_engagement"],
  },
  youtube: {
    name: "YouTube",
    icon: "▶️",
    bg: "from-red-600 to-red-700",
    scopes: ["youtube.upload", "youtube.readonly", "userinfo.profile"],
  },
  tiktok: {
    name: "TikTok",
    icon: "🎵",
    bg: "from-slate-950 to-slate-800",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
  },
  facebook: {
    name: "Facebook",
    icon: "📘",
    bg: "from-blue-600 to-blue-700",
    scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"],
  },
  linkedin: {
    name: "LinkedIn",
    icon: "👔",
    bg: "from-blue-700 to-sky-600",
    scopes: ["w_member_social", "openid", "profile"],
  },
  pinterest: {
    name: "Pinterest",
    icon: "📌",
    bg: "from-red-500 to-rose-600",
    scopes: ["boards:read", "boards:write", "pins:read", "pins:write"],
  },
  discord: {
    name: "Discord",
    icon: "💬",
    bg: "from-indigo-600 to-violet-500",
    scopes: ["identify", "guilds", "connections"],
  },
  twitter: {
    name: "Twitter / X",
    icon: "🐦",
    bg: "from-slate-900 to-slate-950",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  },
  slack: {
    name: "Slack",
    icon: "💼",
    bg: "from-emerald-600 to-teal-500",
    scopes: ["channels:read", "chat:write", "incoming-webhook"],
  },
};

function MockOAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const platform = searchParams.get("platform") || "instagram";
  const details = platformDetails[platform.toLowerCase()] || {
    name: platform,
    icon: "🔌",
    bg: "from-slate-600 to-slate-700",
    scopes: ["basic_access"],
  };

  const handleAuthorize = () => {
    // Redirect back to callback handler with simulated mock code
    router.push(`/api/oauth/${platform}/callback?code=mock_code_${platform}_${Date.now()}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-800 shadow-inner">
            <span className="text-3xl">{details.icon}</span>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-100">
            Connect to {details.name}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1">
            Social Copilot is requesting access to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5">
          {/* Mock Mode Alert */}
          <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
            <ShieldAlert className="size-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Sandbox Developer Environment</p>
              <p className="mt-1 leading-relaxed">
                OAuth keys are not configured in <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">.env.local</code>. Running a simulated auth flow.
              </p>
            </div>
          </div>

          {/* Scope Request Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Requested Permissions:
            </p>
            <ul className="space-y-2.5">
              {details.scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="size-4 shrink-0 text-indigo-400" />
                  <code>{scope}</code>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 pt-2 pb-6">
          <button
            onClick={handleAuthorize}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full rounded-xl bg-gradient-to-r text-white font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer",
              details.bg
            )}
          >
            Authorize (Simulate Connect)
          </button>
          
          <Link
            href="/accounts"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "w-full rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            Cancel
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function MockOAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-slate-400">
          Loading sandbox configuration...
        </div>
      }
    >
      <MockOAuthContent />
    </Suspense>
  );
}
