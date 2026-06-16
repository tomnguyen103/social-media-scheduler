"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Billing error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-4">
        <AlertCircle className="size-6" />
      </div>
      
      <h3 className="text-xl font-bold tracking-tight font-heading text-foreground">
        Failed to load Billing Information
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed text-balance">
        We could not load your active subscription plan or limits. Please try again.
      </p>

      {error.message && (
        <pre className="mt-4 rounded-lg bg-muted p-3 text-left font-mono text-xs max-w-lg overflow-x-auto text-destructive border border-border/40">
          <code>{error.message}</code>
        </pre>
      )}

      <div className="mt-6">
        <Button 
          onClick={() => reset()} 
          className="cursor-pointer font-semibold shadow-xs gap-1.5"
        >
          <RotateCcw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
