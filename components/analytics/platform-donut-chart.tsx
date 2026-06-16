"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformDonutChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  Facebook: "#1877f2",
  Twitter: "#1da1f2",
  Linkedin: "#0a66c2",
  Youtube: "#ff0000",
  Tiktok: "#00f2fe",
  Discord: "#5865f2",
  Slack: "#4a154b",
  Pinterest: "#bd081c"
};

const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981", "#f59e0b"];

export function PlatformDonutChart({ data }: PlatformDonutChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const totalPosts = data.reduce((sum, item) => sum + item.value, 0);

  if (!isMounted) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Posts by Platform</CardTitle>
          <CardDescription>Distribution of content across networks</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[220px] w-[220px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (totalPosts === 0) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Posts by Platform</CardTitle>
          <CardDescription>Distribution of content across networks</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6">
          <p className="text-sm text-muted-foreground font-medium">No platform data available</p>
          <p className="text-xs text-muted-foreground/80 mt-1">Publish posts to see platform distribution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Posts by Platform</CardTitle>
        <CardDescription>Distribution of content across networks</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => {
                const color = COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} posts (${((Number(value) / totalPosts) * 100).toFixed(0)}%)`, "Volume"]}
              contentStyle={{
                backgroundColor: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
                borderRadius: "var(--radius)",
                color: "oklch(var(--foreground))",
              }}
            />
            <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
