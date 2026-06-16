import { Skeleton } from "@/components/ui/skeleton";

export default function AutoReplyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg shrink-0" />
      </div>

      {/* Rules list loading skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            {/* Top row of card */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>

            {/* Middle section: Platforms & Keywords */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-border/10 text-xs">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-16" />
                <div className="flex gap-1.5 mt-1">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton className="size-5 rounded-md" />
                </div>
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <Skeleton className="h-3.5 w-20" />
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </div>
            </div>

            {/* Bottom section: Response template */}
            <div className="bg-muted/30 border border-border/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-[90%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
