"use client";

import { Calendar, CheckCircle2, Link2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reason: "ai" | "accounts" | "posts";
  limit?: number;
};

export function UpgradeModal({ isOpen, onClose, reason, limit }: UpgradeModalProps) {
  const getReasonDetails = () => {
    switch (reason) {
      case "ai":
        return {
          title: "Unlock Gemini AI Assistant",
          description:
            "Create high-converting captions and discover trending hashtags instantly. Gemini AI features require a Pro or Agency subscription.",
          icon: <Sparkles className="size-6 text-indigo-500 animate-pulse" />,
          iconBg: "bg-indigo-500/10",
        };
      case "accounts":
        return {
          title: "Account Limit Reached",
          description: `You have reached the limit of ${
            limit ?? 3
          } connected social profiles on your Free plan. Upgrade to link more channels.`,
          icon: <Link2 className="size-6 text-violet-500" />,
          iconBg: "bg-violet-500/10",
        };
      case "posts":
        return {
          title: "Monthly Post Limit Reached",
          description: `You have reached your limit of ${
            limit ?? 10
          } published posts this month. Level up your plan to publish and schedule unlimited posts.`,
          icon: <Calendar className="size-6 text-amber-500" />,
          iconBg: "bg-amber-500/10",
        };
    }
  };

  const details = getReasonDetails();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground rounded-2xl border-border">
        <DialogHeader className="text-center">
          <div
            className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${details.iconBg}`}
          >
            {details.icon}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {details.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
            {details.description}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Comparison List */}
        <div className="my-4 space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
            <CheckCircle2 className="size-5 shrink-0 text-indigo-500 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Pro Plan ($19/mo)</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Connect up to 10 accounts, schedule unlimited posts, and access Gemini AI assistants.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
            <CheckCircle2 className="size-5 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Agency Plan ($49/mo)</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Connect unlimited accounts, schedule unlimited posts, access AI tools, and priority workflows.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            href="/dashboard/billing"
            onClick={onClose}
            className="w-full text-center py-2 bg-primary text-primary-foreground font-semibold rounded-xl shadow-[0_8px_20px_-6px_oklch(0.6_0.27_296_/_0.3)] hover:brightness-105 active:scale-95 transition-all text-sm flex items-center justify-center"
          >
            Upgrade Now
          </Link>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-xl text-muted-foreground hover:bg-muted"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
