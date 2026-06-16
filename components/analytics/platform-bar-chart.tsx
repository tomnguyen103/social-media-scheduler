"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformBarChartProps {
  data: {
    platform: string;
    engagementRate: number;
    totalEngagement: number;
    fill: string;
  }[];
}

export function PlatformBarChart({ data }: PlatformBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Engagement by Platform</CardTitle>
          <CardDescription>Average engagement rates per platform</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Engagement by Platform</CardTitle>
          <CardDescription>Average engagement rates per platform</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6">
          <p className="text-sm text-muted-foreground font-medium">No engagement data available</p>
          <p className="text-xs text-muted-foreground/80 mt-1">Publish posts with reach to measure engagement rates</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Engagement by Platform</CardTitle>
        <CardDescription>Average engagement rates per platform</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.4)" />
            <XAxis
              dataKey="platform"
              tickLine={false}
              axisLine={false}
              stroke="oklch(var(--muted-foreground))"
              fontSize={11}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="oklch(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (name === "Engagement Rate") return [`${value}%`, name];
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
                borderRadius: "var(--radius)",
                color: "oklch(var(--foreground))",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              labelClassName="font-bold text-foreground mb-1"
              // Include extra info in tooltip
              labelFormatter={(label) => {
                const item = data.find(d => d.platform === label);
                return `${label} (${item?.totalEngagement || 0} total engagements)`;
              }}
            />
            <Bar
              dataKey="engagementRate"
              name="Engagement Rate"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
