import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Grid: Current Plan Info & Usage Limits */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Plan Card */}
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 text-muted-foreground" />
            <Skeleton className="h-7 w-36 font-bold" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <div className="pt-2">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        {/* Resource Usage Card - takes 2 cols */}
        <div className="md:col-span-2 rounded-xl border border-border/40 bg-card p-6 space-y-5">
          <Skeleton className="h-5 w-44" />
          
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Account Limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>

            {/* Post Limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing cards divider */}
      <div className="space-y-2 pt-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Pricing Tiers cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card p-6 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4">
              <div className="space-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-28" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              
              <div className="space-y-2.5 pt-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
