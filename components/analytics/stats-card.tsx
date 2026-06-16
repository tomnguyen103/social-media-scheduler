import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
              {value}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0">
            {icon}
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center space-x-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpIcon className="size-3" />
              ) : (
                <ArrowDownIcon className="size-3" />
              )}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
