import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header section skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Main Settings Tabs Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Side Tab Navigation Skeleton */}
        <div className="flex flex-row md:flex-col gap-1 w-full md:w-[220px] rounded-xl border border-border/40 bg-card p-1 shrink-0">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-2.5 px-3 py-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Right Side Settings Panel Skeleton */}
        <div className="flex-1 w-full rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="border-b border-border/40 p-6 space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          
          <div className="p-6 space-y-6">
            {/* Form groups */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="space-y-2 border-b border-border/10 pb-4 last:border-b-0">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="bg-muted/10 border-t border-border/40 p-4 flex justify-end">
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
