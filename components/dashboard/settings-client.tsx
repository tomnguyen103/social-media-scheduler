"use client";

import React, { useState } from "react";
import { UserProfile, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  User, 
  Bell, 
  Link as LinkIcon, 
  AlertTriangle, 
  Loader2, 
  ArrowUpRight,
  Mail,
  FileSpreadsheet,
  Check
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsClientProps {
  initialSettings: {
    plan: string;
    emailOnFailure: boolean;
    weeklyDigest: boolean;
  };
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  
  // Settings local state
  const [emailOnFailure, setEmailOnFailure] = useState(initialSettings.emailOnFailure);
  const [weeklyDigest, setWeeklyDigest] = useState(initialSettings.weeklyDigest);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle Notifications Save
  const handleSaveNotifications = async (
    nextEmailOnFailure: boolean,
    nextWeeklyDigest: boolean
  ) => {
    setIsSavingNotifications(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOnFailure: nextEmailOnFailure,
          weeklyDigest: nextWeeklyDigest,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update notification settings");
      }

      toast.success("Notification preferences updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save notifications");
      // Revert states on error
      setEmailOnFailure(emailOnFailure);
      setWeeklyDigest(weeklyDigest);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      toast.success("Your account has been deleted. Logging you out...");
      
      // Perform Clerk sign-out
      await signOut();
      
      // Redirect to landing page
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  // Adaptive Clerk UserProfile appearance variables matching our theme
  const clerkAppearance = {
    variables: {
      colorPrimary: "oklch(0.6 0.27 296)", // theme primary color
      colorBackground: "hsl(var(--card))",
      colorInputBackground: "hsl(var(--background))",
      colorText: "hsl(var(--foreground))",
      colorTextSecondary: "hsl(var(--muted-foreground))",
      colorBorder: "hsl(var(--border) / 0.5)",
      fontFamily: "inherit",
    },
    elements: {
      cardBox: "shadow-none border border-border/40 rounded-xl bg-card overflow-hidden",
      card: "shadow-none rounded-none p-6",
      navbar: "border-r border-border/40 p-4 bg-muted/10",
      navbarButton: "text-muted-foreground hover:text-foreground transition-colors",
      navbarButtonActive: "text-primary font-bold bg-primary/10",
      headerTitle: "font-heading font-bold text-foreground text-xl",
      headerSubtitle: "text-muted-foreground text-xs",
      profileSectionTitleText: "font-heading font-semibold text-foreground border-b border-border/45 pb-2 text-sm",
      formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors",
      formButtonReset: "text-muted-foreground hover:text-foreground transition-colors",
      footer: "hidden", // Hide Clerk's powered-by branding for premium feel
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight font-heading">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings, configurations, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <TabsList className="flex flex-row md:flex-col items-stretch justify-start w-full md:w-[220px] rounded-xl border border-border/40 bg-card p-1 shrink-0 h-auto overflow-x-auto md:overflow-x-visible">
          <TabsTrigger value="profile" className="justify-start gap-2.5 px-3 py-2 cursor-pointer">
            <User className="size-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start gap-2.5 px-3 py-2 cursor-pointer">
            <Bell className="size-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="justify-start gap-2.5 px-3 py-2 cursor-pointer">
            <LinkIcon className="size-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="justify-start gap-2.5 px-3 py-2 cursor-pointer text-destructive hover:bg-destructive/5 hover:text-destructive data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive">
            <AlertTriangle className="size-4" />
            <span>Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Panel Content */}
        <div className="flex-1 w-full min-w-0">
          {/* PROFILE TAB */}
          <TabsContent value="profile" className="outline-none">
            <UserProfile routing="hash" appearance={clerkAppearance} />
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="outline-none">
            <Card className="border border-border/40 bg-card shadow-xs rounded-xl">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="font-heading font-semibold text-lg">Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive automated emails from Social Copilot.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/40 p-0">
                {/* Preference 1 */}
                <div className="flex items-start justify-between gap-4 p-6">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/40">
                      <Mail className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <label htmlFor="emailOnFailure" className="text-sm font-semibold text-foreground cursor-pointer">
                        Email on Publish Failure
                      </label>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Get notified instantly if a scheduled post fails to publish on any linked social platform.
                      </span>
                    </div>
                  </div>
                  <Switch
                    id="emailOnFailure"
                    checked={emailOnFailure}
                    onCheckedChange={(checked) => {
                      setEmailOnFailure(checked);
                      handleSaveNotifications(checked, weeklyDigest);
                    }}
                    disabled={isSavingNotifications}
                  />
                </div>

                {/* Preference 2 */}
                <div className="flex items-start justify-between gap-4 p-6">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/40">
                      <FileSpreadsheet className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <label htmlFor="weeklyDigest" className="text-sm font-semibold text-foreground cursor-pointer">
                        Weekly Summary Digest
                      </label>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Receive a weekly roundup of post analytics, engagements, reach growth, and auto-reply stats.
                      </span>
                    </div>
                  </div>
                  <Switch
                    id="weeklyDigest"
                    checked={weeklyDigest}
                    onCheckedChange={(checked) => {
                      setWeeklyDigest(checked);
                      handleSaveNotifications(emailOnFailure, checked);
                    }}
                    disabled={isSavingNotifications}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t border-border/40 p-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  {isSavingNotifications ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      Settings are automatically saved
                    </>
                  )}
                </span>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="accounts" className="outline-none">
            <Card className="border border-border/40 bg-card shadow-xs rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading font-semibold text-lg">Connected Accounts</CardTitle>
                <CardDescription>
                  Integrate your profiles to publish, auto-reply, and track analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-dashed border-border p-8 text-center flex flex-col items-center">
                  <LinkIcon className="size-8 text-muted-foreground/60 mb-3" />
                  <h4 className="text-sm font-semibold">Centralized Account Dashboard</h4>
                  <p className="text-xs text-muted-foreground/80 max-w-sm mt-1.5 leading-relaxed">
                    Social Copilot allows linking up to 9 networks (Instagram, Facebook, LinkedIn, TikTok, YouTube, Discord, Slack, Pinterest, and Twitter). You can manage them in a dedicated space.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 p-4 bg-muted/10 flex justify-end">
                <Button 
                  onClick={() => router.push("/accounts")}
                  className="cursor-pointer font-semibold shadow-xs"
                >
                  Manage Social Connections
                  <ArrowUpRight className="ml-1.5 size-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* DANGER ZONE TAB */}
          <TabsContent value="danger" className="outline-none">
            <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/5 shadow-xs rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading font-semibold text-lg text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-destructive/80">
                  Actions here are permanent and cannot be undone. Please be careful.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-destructive/20 rounded-xl p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Delete Account and Data</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                      This will permanently delete your Social Copilot account, disconnect all social platforms, clear scheduled posts, auto-reply logs, and purge billing records.
                    </p>
                  </div>

                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger
                      render={
                        <Button 
                          variant="destructive" 
                          className="font-bold cursor-pointer shrink-0"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          Delete Account
                        </Button>
                      }
                    />
                    <AlertDialogContent size="default" className="border-destructive/30 bg-background shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive font-bold text-lg flex items-center gap-2">
                          <AlertTriangle className="size-5 shrink-0" />
                          Delete Account Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
                          This action is <strong className="text-foreground">irreversible</strong>. You will lose access to all your posts, analytics, auto-reply rules, and connected channels. Are you absolutely sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingAccount}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteAccount();
                          }}
                          disabled={isDeletingAccount}
                          className="font-bold cursor-pointer"
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="size-4 animate-spin mr-1.5" /> Deleting...
                            </>
                          ) : (
                            "Confirm Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
