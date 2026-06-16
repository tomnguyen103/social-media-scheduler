import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-[400px]" />
      </div>

      {/* Account Limit Info Banner */}
      <div className="rounded-xl border border-border/40 bg-card p-4 flex items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md shrink-0" />
      </div>

      {/* Grid of 9 Social Media Accounts Connector Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* Platform Icon skeleton */}
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                {/* Platform Name */}
                <Skeleton className="h-4 w-24" />
                {/* Status Indicator */}
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Connection details / buttons */}
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3.5 w-full" />
              <div className="flex items-center justify-between border-t border-border/20 pt-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
