"use client";

import {
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Link2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PlatformIcon } from "@/components/dashboard/platform-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { Progress } from "@/components/ui/progress";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type SanitizedAccount = {
  id: string;
  platform: string;
  platformUserId: string;
  platformUsername: string;
  createdAt: Date;
  expiresAt: Date | null;
};

type AccountsClientProps = {
  initialAccounts: SanitizedAccount[];
  plan: "free" | "pro" | "agency";
  limit: number;
  unlimited: boolean;
};

type PlatformConfig = {
  id: string;
  name: string;
  color: string;
  gradient: string;
  bgClass: string;
  iconColor: string;
};

const platforms: PlatformConfig[] = [
  {
    id: "twitter",
    name: "Twitter / X",
    color: "text-[#1da1f2] hover:border-[#1da1f2]/30 hover:bg-[#1da1f2]/5",
    gradient: "from-slate-800 to-slate-950",
    bgClass: "bg-[#e8f5fe] dark:bg-[#15202b]",
    iconColor: "text-[#1da1f2]",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "text-[#0a66c2] hover:border-[#0a66c2]/30 hover:bg-[#0a66c2]/5",
    gradient: "from-blue-700 to-sky-500",
    bgClass: "bg-[#e8f0fe] dark:bg-[#1a2b4c]",
    iconColor: "text-[#0a66c2]",
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "text-[#e1306c] hover:border-[#e1306c]/30 hover:bg-[#e1306c]/5",
    gradient: "from-purple-600 via-pink-500 to-amber-500",
    bgClass: "bg-[#fdf0f5] dark:bg-[#3d1a2f]",
    iconColor: "text-[#e1306c]",
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "text-[#ff0000] hover:border-[#ff0000]/30 hover:bg-[#ff0000]/5",
    gradient: "from-red-600 to-red-700",
    bgClass: "bg-[#feebee] dark:bg-[#3d1116]",
    iconColor: "text-[#ff0000]",
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "text-[#010101] dark:text-[#ffffff] hover:border-foreground/30 hover:bg-foreground/5",
    gradient: "from-slate-950 to-slate-800",
    bgClass: "bg-[#f1f1f2] dark:bg-[#202021]",
    iconColor: "text-[#010101] dark:text-[#ffffff]",
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "text-[#1877f2] hover:border-[#1877f2]/30 hover:bg-[#1877f2]/5",
    gradient: "from-blue-600 to-blue-800",
    bgClass: "bg-[#e7f3ff] dark:bg-[#18243e]",
    iconColor: "text-[#1877f2]",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "text-[#bd081c] hover:border-[#bd081c]/30 hover:bg-[#bd081c]/5",
    gradient: "from-red-500 to-rose-600",
    bgClass: "bg-[#fde8e8] dark:bg-[#3d1217]",
    iconColor: "text-[#bd081c]",
  },
  {
    id: "discord",
    name: "Discord",
    color: "text-[#5865f2] hover:border-[#5865f2]/30 hover:bg-[#5865f2]/5",
    gradient: "from-indigo-600 to-violet-500",
    bgClass: "bg-[#eef0fd] dark:bg-[#1e223a]",
    iconColor: "text-[#5865f2]",
  },
  {
    id: "slack",
    name: "Slack",
    color: "text-[#4a154b] hover:border-[#4a154b]/30 hover:bg-[#4a154b]/5",
    gradient: "from-emerald-600 to-teal-500",
    bgClass: "bg-[#f6eff6] dark:bg-[#2d1b2d]",
    iconColor: "text-[#4a154b]",
  },
];

export function AccountsClient({
  initialAccounts,
  plan,
  limit,
  unlimited,
}: AccountsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SanitizedAccount[]>(initialAccounts);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Handle URL callback toast alerts
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const platform = searchParams.get("platform");

    if (success === "connected" && platform) {
      toast.success(`Connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, {
        description: "Account linked successfully to Social Copilot.",
      });
      // Clear search query params
      router.replace("/accounts");
    }

    if (error) {
      if (error === "limit_reached") {
        toast.error("Account Limit Reached", {
          description: "Please upgrade your plan to link more social media channels.",
        });
        setTimeout(() => {
          setUpgradeDialogOpen(true);
        }, 0);
      } else {
        toast.error("Authentication Failed", {
          description: "Something went wrong during the OAuth handshake. Please try again.",
        });
      }
      router.replace("/accounts");
    }
  }, [searchParams, router]);

  const activeCount = accounts.length;
  const isAtLimit = !unlimited && activeCount >= limit;
  const usagePercentage = unlimited ? 0 : Math.min((activeCount / limit) * 100, 100);

  const handleConnect = (platformId: string) => {
    // Check if user is already at their limit for new connections
    const isAlreadyConnected = accounts.some((a) => a.platform === platformId);
    
    if (isAtLimit && !isAlreadyConnected) {
      setUpgradeDialogOpen(true);
      return;
    }

    // Direct browser to initiating route using location.assign
    window.location.assign(`/api/oauth/${platformId}`);
  };

  const handleDisconnect = async (accountId: string, platformName: string) => {
    setIsDisconnecting(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success(`Disconnected from ${platformName.charAt(0).toUpperCase() + platformName.slice(1)}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to disconnect", {
        description: "Could not revoke account linkage. Please try again.",
      });
    } finally {
      setIsDisconnecting(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Plan Status Banner */}
      <Card className="border-border bg-card shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Account Usage
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                {plan} Plan
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {unlimited
                ? `${activeCount} Accounts Connected`
                : `${activeCount} of ${limit} Accounts Linked`}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect profiles from 9 supported social networks. Access limits are enforced per workspace plan tier. Upgrade to unlock bulk automation & AI capabilities.
            </p>
          </div>

          {!unlimited && (
            <div className="w-full md:w-64 space-y-2">
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{usagePercentage.toFixed(0)}% Used</span>
                <span className="text-foreground">{limit - activeCount} Remaining</span>
              </div>
              {isAtLimit && (
                <Button
                  onClick={() => setUpgradeDialogOpen(true)}
                  size="sm"
                  className="w-full mt-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-semibold shadow-md hover:brightness-110 shrink-0"
                >
                  <Sparkles className="size-4 mr-2" />
                  Upgrade for More Space
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Illustrated Empty State Banner */}
      {accounts.length === 0 && (
        <Empty className="border border-dashed py-10 bg-card rounded-xl">
          <EmptyHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Link2 className="size-6" />
            </div>
            <EmptyTitle className="mt-4 text-base font-semibold text-foreground">No Accounts Connected</EmptyTitle>
            <EmptyDescription className="text-xs max-w-md">
              Link a social profile below to start posting. You can connect and manage channels for Instagram, YouTube, TikTok, LinkedIn, and more.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Grid of Platform Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const connected = accounts.filter((a) => a.platform === platform.id);
          const isPlatformConnected = connected.length > 0;

          return (
            <Card
              key={platform.id}
              className={cn(
                "group border-border bg-card hover:shadow-xl hover:border-primary/20 transition duration-300 relative flex flex-col justify-between overflow-hidden",
                isPlatformConnected && "ring-1 ring-primary/10"
              )}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full border border-border/50 group-hover:scale-105 transition-transform duration-200 shadow-inner",
                    platform.bgClass,
                    platform.iconColor
                  )}
                >
                  <PlatformIcon platform={platform.id} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold tracking-tight text-foreground">
                    {platform.name}
                  </CardTitle>
                  <CardDescription className="text-xs truncate">
                    {isPlatformConnected && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Connected
                      </span>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="text-xs text-muted-foreground pb-4 min-h-[48px] flex flex-col justify-center">
                {isPlatformConnected ? (
                  <div className="space-y-2.5">
                    {connected.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between gap-2 bg-muted/50 p-2.5 rounded-xl border border-border/50"
                      >
                        <span className="font-semibold text-foreground truncate select-all">
                          {acc.platformUsername}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(acc.id, platform.id)}
                          disabled={isDisconnecting === acc.id}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
                          title="Disconnect Account"
                        >
                          {isDisconnecting === acc.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground/60 py-6 font-medium">
                    No account connected
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/40 bg-muted/10 group-hover:bg-muted/20 transition-colors">
                <Button
                  onClick={() => handleConnect(platform.id)}
                  variant="outline"
                  className={cn(
                    "w-full rounded-xl font-semibold cursor-pointer border-border/60 hover:bg-muted/50",
                    !isPlatformConnected && "text-foreground hover:text-foreground"
                  )}
                >
                  {isPlatformConnected ? (
                    <>
                      <Plus className="size-4 mr-2" />
                      Add Another
                    </>
                  ) : (
                    <>
                      <Link2 className="size-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Dialog Modals */}
      <UpgradeModal
        isOpen={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        reason="accounts"
        limit={limit}
      />
    </div>
  );
}
