import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
      </div>

      {/* Social channel filter chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Calendar toolbar: Nav & Switch View buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/40 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>

      {/* Grid container representing the calendar days */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        {/* Calendar days of week header */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={idx} className="p-3 text-center border-r border-border/20 last:border-r-0">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* 35 calendar squares represent days */}
        <div className="grid grid-cols-7 grid-rows-5 divide-x divide-y divide-border/20">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="aspect-square min-h-[90px] p-2 space-y-2 border-r border-b border-border/20 last:border-r-0">
              <div className="flex justify-between items-center">
                <Skeleton className="size-5 rounded-full" />
              </div>
              <div className="space-y-1">
                {idx % 4 === 0 && <Skeleton className="h-5 w-full rounded" />}
                {idx % 7 === 1 && <Skeleton className="h-5 w-[85%] rounded" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
