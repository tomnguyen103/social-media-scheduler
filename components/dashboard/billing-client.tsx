"use client";

import { useClerk } from "@clerk/nextjs";
import { CheckCircle2, CreditCard, Sparkles, AlertCircle, Calendar, Link2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PaymentAttempt = {
  id: string;
  amount: number; // in cents
  status: string;
  created: number; // Unix timestamp
};

type BillingClientProps = {
  plan: "free" | "pro" | "agency";
  accountsCount: number;
  accountsLimit: number;
  accountsUnlimited: boolean;
  postsCount: number;
  postsLimit: number;
  postsUnlimited: boolean;
};

export function BillingClient({
  plan,
  accountsCount,
  accountsLimit,
  accountsUnlimited,
  postsCount,
  postsLimit,
  postsUnlimited,
}: BillingClientProps) {
  const clerk = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttempt[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!clerk.loaded) return;
      try {
        const attempts = await clerk.billing.getPaymentAttempts({
          pageSize: 10,
        });
        const mapped = attempts.data.map((attempt: {
          id: string;
          amount: { amount: number };
          status: string;
          paidAt: Date | string | null;
          failedAt: Date | string | null;
          updatedAt: Date | string;
        }) => ({
          id: attempt.id,
          amount: attempt.amount.amount,
          status: attempt.status,
          created: attempt.paidAt
            ? Math.floor(new Date(attempt.paidAt).getTime() / 1000)
            : attempt.failedAt
              ? Math.floor(new Date(attempt.failedAt).getTime() / 1000)
              : Math.floor(new Date(attempt.updatedAt).getTime() / 1000),
        }));
        setPaymentAttempts(mapped);
      } catch (error) {
        console.error("Clerk Billing getPaymentAttempts failed:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [clerk.loaded, clerk.billing]);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      clerk.openUserProfile();
    } catch (error) {
      console.error("Failed to open user profile:", error);
      toast.error("Billing Portal Unavailable", {
        description: "Could not open subscription portal. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const accountUsagePct = accountsUnlimited ? 0 : Math.min((accountsCount / accountsLimit) * 100, 100);
  const postUsagePct = postsUnlimited ? 0 : Math.min((postsCount / postsLimit) * 100, 100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Overview Cards & Usage Meters */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan Summary Card */}
        <Card className="border-border bg-card shadow-md flex flex-col justify-between relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="pb-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Plan
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold capitalize text-foreground mt-1 flex items-center gap-2.5">
              {plan} Plan
              {plan !== "free" && (
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-primary">
                  Active
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed flex-1">
            {plan === "free" && (
              <p>You are on the Free tier. Upgrade to unlock Gemini AI features and expand account limits.</p>
            )}
            {plan === "pro" && (
              <p>You have access to AI capabilities, 10 linked profiles, and unlimited scheduling workflows.</p>
            )}
            {plan === "agency" && (
              <p>You have unlimited connections, priorities workflows, and full AI automation capabilities.</p>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t border-border/40">
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-semibold shadow-md hover:brightness-105 shrink-0 rounded-xl"
            >
              <CreditCard className="size-4 mr-2" />
              {plan === "free" ? "Upgrade Plan" : "Manage Subscription"}
            </Button>
          </CardFooter>
        </Card>

        {/* Accounts Usage Card */}
        <Card className="border-border bg-card shadow-md flex flex-col justify-between h-full">
          <CardHeader className="pb-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Account Connections</span>
              <Link2 className="size-3.5" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground mt-1">
              {accountsUnlimited ? `${accountsCount}` : `${accountsCount} / ${accountsLimit}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Total number of active social media profile linkages currently added to your workspace.
            </p>
            {!accountsUnlimited ? (
              <div className="space-y-2">
                <Progress value={accountUsagePct} className="h-2" />
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>{accountUsagePct.toFixed(0)}% Used</span>
                  <span>{accountsLimit - accountsCount} remaining</span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="size-4" /> Unlimited account connections allowed
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts Usage Card */}
        <Card className="border-border bg-card shadow-md flex flex-col justify-between h-full">
          <CardHeader className="pb-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Posts Created This Month</span>
              <Calendar className="size-3.5" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground mt-1">
              {postsUnlimited ? `${postsCount}` : `${postsCount} / ${postsLimit}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Number of posts successfully scheduled or published in the current calendar month.
            </p>
            {!postsUnlimited ? (
              <div className="space-y-2">
                <Progress value={postUsagePct} className="h-2" />
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>{postUsagePct.toFixed(0)}% Used</span>
                  <span>{postsLimit - postsCount} remaining</span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="size-4" /> Unlimited posts scheduling allowed
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table / Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Card */}
          <Card className={cn("border border-border/60 bg-card/60 relative flex flex-col justify-between rounded-2xl shadow-sm", plan === "free" && "ring-1 ring-primary/40 bg-card")}>
            <CardHeader className="pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Free Plan</div>
              <div className="text-3xl font-extrabold text-foreground mt-2">$0 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Up to 3 connected profiles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> 10 published posts / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Content calendar view</li>
                <li className="flex items-center gap-2 text-muted-foreground/40"><CheckCircle2 className="size-4 text-muted-foreground/30 shrink-0" /> No Gemini AI features</li>
                <li className="flex items-center gap-2 text-muted-foreground/40"><CheckCircle2 className="size-4 text-muted-foreground/30 shrink-0" /> No Auto-Reply Rules</li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/40 bg-muted/5 rounded-b-2xl">
              {plan === "free" ? (
                <Button variant="outline" className="w-full rounded-xl cursor-default border-primary/20 bg-primary/5 text-primary hover:bg-primary/5 font-semibold" disabled>Current Plan</Button>
              ) : (
                <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline" className="w-full rounded-xl font-semibold">Downgrade to Free</Button>
              )}
            </CardFooter>
          </Card>

          {/* Pro Card */}
          <Card className={cn("border border-border bg-card/60 relative flex flex-col justify-between rounded-2xl shadow-md", plan === "pro" && "ring-2 ring-primary bg-card")}>
            {plan === "pro" && (
              <div className="absolute top-3 right-3 text-primary"><Sparkles className="size-4 animate-pulse" /></div>
            )}
            <CardHeader className="pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">Pro Plan <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-bold">Popular</span></div>
              <div className="text-3xl font-extrabold text-foreground mt-2">$19 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Up to 10 connected profiles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Unlimited monthly publishing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Gemini AI suggestions (captions/hashtags)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Auto-reply rules & automation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary shrink-0" /> Analytics overview dashboard</li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/40 bg-muted/5 rounded-b-2xl">
              {plan === "pro" ? (
                <Button variant="outline" className="w-full rounded-xl cursor-default border-primary/20 bg-primary/5 text-primary hover:bg-primary/5 font-semibold" disabled>Current Plan</Button>
              ) : (
                <Button onClick={handleManageSubscription} disabled={isLoading} className="w-full bg-primary text-primary-foreground font-semibold shadow-md hover:brightness-105 rounded-xl">{plan === "free" ? "Upgrade to Pro" : "Downgrade to Pro"}</Button>
              )}
            </CardFooter>
          </Card>

          {/* Agency Card */}
          <Card className={cn("border border-border/60 bg-card/60 relative flex flex-col justify-between rounded-2xl shadow-sm", plan === "agency" && "ring-2 ring-amber-500 bg-card")}>
            <CardHeader className="pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500">Agency Plan</div>
              <div className="text-3xl font-extrabold text-foreground mt-2">$49 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Unlimited profile integrations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Unlimited monthly publishing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Full Gemini AI optimization toolkit</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Priority API workflow pipeline</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> 24/7 dedicated workspace support</li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/40 bg-muted/5 rounded-b-2xl">
              {plan === "agency" ? (
                <Button variant="outline" className="w-full rounded-xl cursor-default border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/5 font-semibold" disabled>Current Plan</Button>
              ) : (
                <Button onClick={handleManageSubscription} disabled={isLoading} className={cn("w-full font-semibold rounded-xl text-white shadow-md hover:brightness-105", plan === "free" ? "bg-gradient-to-r from-amber-500 to-indigo-600" : "bg-amber-500")}>Upgrade to Agency</Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Transaction History</h3>
        <Card className="border border-border/60 bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isHistoryLoading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-8 text-primary animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Loading transactions</p>
                  <p className="text-xs text-muted-foreground mt-1">Retrieving payment history from Clerk...</p>
                </div>
              </div>
            ) : paymentAttempts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <AlertCircle className="size-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-semibold text-foreground">No transaction history</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan === "free" ? "You have no past purchases as a Free subscriber." : "Transactions will appear here once they are processed by Clerk."}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="px-6 py-4">Billing Date</TableHead>
                    <TableHead className="px-6 py-4">Transaction ID</TableHead>
                    <TableHead className="px-6 py-4 text-right">Amount Paid</TableHead>
                    <TableHead className="px-6 py-4 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentAttempts.map((item) => {
                    const formattedDate = new Date(item.created * 1000).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    const formattedAmount = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(item.amount / 100);

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/10">
                        <TableCell className="px-6 py-4 text-sm font-medium text-foreground">{formattedDate}</TableCell>
                        <TableCell className="px-6 py-4 text-sm font-mono text-muted-foreground">{item.id}</TableCell>
                        <TableCell className="px-6 py-4 text-sm font-semibold text-foreground text-right">{formattedAmount}</TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                            item.status === "succeeded" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25",
                            item.status === "failed" && "bg-destructive/10 text-destructive border border-destructive/25",
                            item.status !== "succeeded" && item.status !== "failed" && "bg-zinc-500/10 text-zinc-500 border border-zinc-500/25"
                          )}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
