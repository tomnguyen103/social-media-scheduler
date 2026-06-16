"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/dashboard/platform-icon";
import { RuleBuilderDialog } from "./rule-builder-dialog";
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyContent, 
  EmptyMedia 
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type SanitizedAccount = {
  id: string;
  platform: string;
  platformUsername: string;
};

type Rule = {
  id: string;
  name: string;
  triggerType: "keyword_match" | "any_comment" | "first_comment";
  keywords: string[];
  responseTemplate: string;
  useAI: boolean;
  isActive: boolean;
  platformAccountIds: string[];
  createdAt: Date;
};

type AutoReplyClientProps = {
  initialRules: Rule[];
  initialAccounts: SanitizedAccount[];
  plan: "free" | "pro" | "agency";
};

export function AutoReplyClient({
  initialRules,
  initialAccounts,
  plan,
}: AutoReplyClientProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filter rules by search term
  const filteredRules = rules.filter((rule) => {
    const term = searchTerm.toLowerCase();
    return (
      rule.name.toLowerCase().includes(term) ||
      rule.triggerType.toLowerCase().includes(term) ||
      rule.keywords.some((kw) => kw.toLowerCase().includes(term))
    );
  });

  // Handle active toggle switch change
  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    setIsTogglingId(ruleId);
    const newStatus = !currentStatus;

    try {
      const res = await fetch(`/api/auto-reply/${ruleId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to toggle rule state.");
      }

      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive: newStatus } : r))
      );

      toast.success(`Rule ${newStatus ? "enabled" : "disabled"} successfully.`);
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Failed to update rule status.";
      toast.error(errorMsg);
    } finally {
      setIsTogglingId(null);
    }
  };

  // Handle rule delete
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this auto-reply rule?")) {
      return;
    }

    setIsDeletingId(ruleId);
    try {
      const res = await fetch(`/api/auto-reply/${ruleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete rule.");
      }

      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Auto-reply rule deleted successfully.");
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Failed to delete rule.";
      toast.error(errorMsg);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Open builder for new rule
  const handleNewRule = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  // Open builder for editing rule
  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  // Dialog submit handler (create / update)
  const handleDialogSubmit = async (data: {
    id?: string;
    name: string;
    triggerType: "keyword_match" | "any_comment" | "first_comment";
    keywords: string[];
    responseTemplate: string;
    useAI: boolean;
    platformAccountIds: string[];
  }) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/auto-reply/${data.id}` : "/api/auto-reply";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to ${isEditing ? "update" : "create"} rule.`);
    }

    const result = await res.json();
    const savedRule = result.rule;

    if (isEditing) {
      setRules((prev) => prev.map((r) => (r.id === savedRule.id ? savedRule : r)));
      toast.success(`Rule "${savedRule.name}" updated successfully.`);
    } else {
      setRules((prev) => [savedRule, ...prev]);
      toast.success(`Rule "${savedRule.name}" created successfully.`);
    }
  };

  // Format trigger type label
  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "keyword_match":
        return "Keyword Match";
      case "any_comment":
        return "Any Comment";
      case "first_comment":
        return "First Comment";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            🤖 Auto-Reply Rules
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Automate post responses using static templates or Gemini AI engine based on user trigger events.
          </p>
        </div>
        <Button
          onClick={handleNewRule}
          className="rounded-xl font-bold bg-primary text-primary-foreground hover:brightness-105 shadow-md px-5 cursor-pointer shrink-0"
        >
          <Plus className="size-4.5 mr-2" />
          Create New Rule
        </Button>
      </div>

      {/* Plan Status Promo Banner for Free users */}
      {plan === "free" && (
        <Card className="border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-5 justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 shrink-0">
                <Sparkles className="size-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                  Unlock AI Auto-Replies
                  <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 font-semibold px-2 hover:bg-indigo-500/15 text-[10px]">
                    Pro Feature
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Supercharge your accounts! Use Gemini AI model to write natural, context-aware responses to user inquiries 24/7.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-background px-4 text-xs font-bold text-indigo-500 hover:bg-indigo-500/10 transition-colors shrink-0 self-center"
            >
              Upgrade Account
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 size-4.5 text-muted-foreground/70" />
        <Input
          type="search"
          placeholder="Search rules by name, trigger type, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-5 rounded-xl border-border bg-card shadow-sm text-sm"
        />
      </div>

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <Empty className="border border-dashed py-14 bg-card rounded-xl">
          <EmptyMedia variant="icon">
            <Bot className="size-5" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-foreground">No Auto-Reply Rules Found</EmptyTitle>
            <EmptyDescription className="text-xs max-w-sm">
              {searchTerm
                ? "No rules match your search criteria. Try using different keywords or terms."
                : "You haven't set up any auto-reply rules yet. Create one now to automate comment engagement!"}
            </EmptyDescription>
          </EmptyHeader>
          {!searchTerm && (
            <EmptyContent>
              <Button onClick={handleNewRule} className="rounded-xl font-bold cursor-pointer mt-2 shadow-sm">
                <Plus className="size-4 mr-2" />
                Add Your First Rule
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            // Find connected accounts configured for this rule
            const matchedAccounts = initialAccounts.filter((acc) =>
              rule.platformAccountIds?.includes(acc.id)
            );

            return (
              <Card
                key={rule.id}
                className={cn(
                  "border-border bg-card hover:shadow-lg hover:border-primary/10 transition duration-300 relative overflow-hidden flex flex-col justify-between",
                  !rule.isActive && "opacity-75"
                )}
              >
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left Column: Icon and Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className={cn(
                        "size-12 rounded-2xl border flex items-center justify-center shadow-inner shrink-0",
                        rule.useAI
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                          : "bg-muted/40 border-border text-muted-foreground"
                      )}
                    >
                      {rule.useAI ? (
                        <Sparkles className="size-5.5 animate-pulse" />
                      ) : (
                        <MessageSquare className="size-5.5" />
                      )}
                    </div>

                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-base font-bold text-foreground tracking-tight truncate">
                          {rule.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full hover:bg-secondary",
                            rule.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {rule.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>

                      {/* Rule Description line */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Trigger: <span className="font-bold text-foreground">{getTriggerLabel(rule.triggerType)}</span>
                        {rule.useAI ? (
                          <span className="inline-flex items-center gap-1 ml-2 font-bold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-full text-[10px]">
                            <Sparkles className="size-3" /> AI Respond
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 ml-2 font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px]">
                            Template Reply
                          </span>
                        )}
                      </p>

                      {/* Target connected accounts tags */}
                      {matchedAccounts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                            Applies to:
                          </span>
                          {matchedAccounts.map((acc) => (
                            <span
                              key={acc.id}
                              className="inline-flex items-center gap-1 bg-muted/60 border border-border/60 text-foreground px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            >
                              <PlatformIcon platform={acc.platform} size={11} className="shrink-0" />
                              {acc.platformUsername}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Keywords list tags (Conditional) */}
                      {rule.triggerType === "keyword_match" && rule.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                            Keywords:
                          </span>
                          {rule.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full text-[10px]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Switch Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border/40 pt-4 md:pt-0 md:border-t-0 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {rule.isActive ? "Enabled" : "Disabled"}
                      </span>
                      {/* Using HTML checkbox styled like switch because shadcn switch might have import path details */}
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          disabled={isTogglingId === rule.id}
                          onChange={() => handleToggleActive(rule.id, rule.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-card after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                        className="rounded-lg h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Edit Rule"
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeletingId === rule.id}
                        onClick={() => handleDeleteRule(rule.id)}
                        className="rounded-lg h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Rule"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Show template preview in card body */}
                {!rule.useAI && rule.responseTemplate && (
                  <div className="bg-muted/10 border-t border-border/40 p-4 text-xs font-mono text-muted-foreground leading-relaxed truncate">
                    Template: &quot;{rule.responseTemplate}&quot;
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Rule Builder Dialog */}
      <RuleBuilderDialog
        key={dialogOpen ? (editingRule?.id || "new") : "closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingRule}
        accounts={initialAccounts}
        plan={plan}
      />
    </div>
  );
}
