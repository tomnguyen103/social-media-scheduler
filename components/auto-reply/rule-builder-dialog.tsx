"use client";

import { useState } from "react";
import { Sparkles, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { PlatformIcon } from "@/components/dashboard/platform-icon";
import { PLAN_LIMITS } from "@/lib/plan-limits";

type ConnectedAccount = {
  id: string;
  platform: string;
  platformUsername: string;
};

type RuleData = {
  id?: string;
  name: string;
  triggerType: "keyword_match" | "any_comment" | "first_comment";
  keywords: string[];
  responseTemplate: string;
  useAI: boolean;
  platformAccountIds: string[];
};

type RuleBuilderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RuleData) => Promise<void>;
  initialData?: RuleData | null;
  accounts: ConnectedAccount[];
  plan: "free" | "pro" | "agency";
};

export function RuleBuilderDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  accounts,
  plan,
}: RuleBuilderDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [triggerType, setTriggerType] = useState<"keyword_match" | "any_comment" | "first_comment">(
    initialData?.triggerType || "keyword_match"
  );
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [responseTemplate, setResponseTemplate] = useState(initialData?.responseTemplate || "");
  const [useAI, setUseAI] = useState(initialData?.useAI || false);
  const [platformAccountIds, setPlatformAccountIds] = useState<string[]>(
    initialData?.platformAccountIds || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLimits = PLAN_LIMITS[plan];
  const hasAIAccess = planLimits.hasAI;



  // Handle adding keywords
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setKeywords(keywords.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle account selection toggling
  const handleToggleAccount = (accountId: string) => {
    if (platformAccountIds.includes(accountId)) {
      setPlatformAccountIds(platformAccountIds.filter((id) => id !== accountId));
    } else {
      setPlatformAccountIds([...platformAccountIds, accountId]);
    }
  };

  // Submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Rule name is required.");
      return;
    }

    if (triggerType === "keyword_match" && keywords.length === 0) {
      setError("Please add at least one keyword for matching.");
      return;
    }

    if (!useAI && !responseTemplate.trim()) {
      setError("Please write a response template.");
      return;
    }

    if (platformAccountIds.length === 0) {
      setError("Please select at least one connected account.");
      return;
    }

    if (useAI && !hasAIAccess) {
      setError("AI replies are only available on Pro or Agency plans.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id,
        name,
        triggerType,
        keywords: triggerType === "keyword_match" ? keywords : [],
        responseTemplate: useAI ? "" : responseTemplate,
        useAI,
        platformAccountIds,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong saving the rule.";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card text-card-foreground rounded-2xl border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {initialData ? "Edit Auto-Reply Rule" : "Create Auto-Reply Rule"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Configure triggers, targeting, and responses to automate your engagements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 py-2">
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 text-destructive p-3.5 rounded-xl border border-destructive/20 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Rule Name */}
          <div className="space-y-1.5">
            <Label htmlFor="rule-name" className="text-sm font-semibold text-foreground">
              Rule Name
            </Label>
            <Input
              id="rule-name"
              placeholder="e.g. Pricing Inquiry Auto-Reply"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-border"
              required
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-1.5">
            <Label htmlFor="trigger-type" className="text-sm font-semibold text-foreground">
              Trigger Event
            </Label>
            <NativeSelect
              id="trigger-type"
              value={triggerType}
              onChange={(e) =>
                setTriggerType(e.target.value as "keyword_match" | "any_comment" | "first_comment")
              }
              className="rounded-xl border-border"
            >
              <option value="keyword_match">Keyword Match (Contains specific words)</option>
              <option value="any_comment">Any Comment (Respond to all new comments)</option>
              <option value="first_comment">First Comment on Post (Respond only once per post)</option>
            </NativeSelect>
          </div>

          {/* Keyword Input (Conditional) */}
          {triggerType === "keyword_match" && (
            <div className="space-y-2">
              <Label htmlFor="keyword-input" className="text-sm font-semibold text-foreground">
                Keywords to Match
              </Label>
              <div className="flex gap-2">
                <Input
                  id="keyword-input"
                  placeholder="Type a word and press Enter or comma"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="rounded-xl border-border"
                />
                <Button
                  type="button"
                  onClick={handleAddKeyword}
                  variant="outline"
                  className="rounded-xl shrink-0 font-medium"
                >
                  Add
                </Button>
              </div>

              {/* Keyword Badges */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 border border-border/50 rounded-xl">
                  {keywords.map((kw, idx) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-full text-xs"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-500/20 p-0.5 rounded-full shrink-0"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Response Type Select */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Response Type</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Template option */}
              <div
                onClick={() => setUseAI(false)}
                className={`flex flex-col gap-1 p-3.5 border rounded-xl cursor-pointer hover:border-primary/40 transition-colors ${
                  !useAI
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-sm font-bold text-foreground">Response Template</span>
                <span className="text-xs text-muted-foreground leading-snug">
                  Use static text. Replace username placeholder dynamically.
                </span>
              </div>

              {/* AI Option */}
              <div
                onClick={() => hasAIAccess && setUseAI(true)}
                className={`flex flex-col gap-1 p-3.5 border rounded-xl transition-colors relative ${
                  !hasAIAccess
                    ? "opacity-60 cursor-not-allowed border-border bg-muted/40"
                    : "cursor-pointer hover:border-primary/40"
                } ${
                  useAI && hasAIAccess
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : ""
                }`}
              >
                {!hasAIAccess && (
                  <span className="absolute top-2 right-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-full p-1 text-[9px] font-bold inline-flex items-center gap-1 shrink-0">
                    <Sparkles className="size-2.5" />
                    PRO+
                  </span>
                )}
                <span className="text-sm font-bold text-foreground inline-flex items-center gap-1">
                  AI-Generated
                  {hasAIAccess && <Sparkles className="size-3.5 text-indigo-500" />}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">
                  Gemini AI writes a contextual reply based on the post.
                </span>
              </div>
            </div>
          </div>

          {/* Response Textarea (Conditional) */}
          {!useAI ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="response-template" className="text-sm font-semibold text-foreground">
                  Response Template
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Use {"{username}"} for user tags
                </span>
              </div>
              <Textarea
                id="response-template"
                placeholder="e.g. Hi {username}! Thanks for commenting, we've sent you a DM."
                value={responseTemplate}
                onChange={(e) => setResponseTemplate(e.target.value)}
                className="rounded-xl border-border min-h-[100px]"
                required={!useAI}
              />
            </div>
          ) : (
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 space-y-1 text-xs">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                <Sparkles className="size-3.5 shrink-0" />
                Gemini AI Agent Mode
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Rules using AI-Generated responses do not need a template. The comment poller enqueues a job where Gemini reads the original post content, analyzes the comment tone/intent, and drafts an engaging, natural response.
              </p>
            </div>
          )}

          {/* Target Platforms Scope */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Target Accounts</Label>
            
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-dashed rounded-xl p-4 text-center font-medium">
                No connected accounts available. Please link accounts in the Accounts page first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1">
                {accounts.map((acc) => {
                  const isChecked = platformAccountIds.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleToggleAccount(acc.id)}
                      className={`flex items-center gap-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Checkbox
                        id={`acc-chk-${acc.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleAccount(acc.id)}
                        className="rounded-md"
                      />
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <PlatformIcon platform={acc.platform} size={15} className="shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {acc.platformUsername}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold bg-primary text-primary-foreground hover:brightness-105 shadow-md px-6 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
