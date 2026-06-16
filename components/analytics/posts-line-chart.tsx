"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PostsLineChartProps {
  data: {
    date: string;
    posts: number;
    reach: number;
    engagement: number;
  }[];
}

export function PostsLineChart({ data }: PostsLineChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (!isMounted) {
    return (
      <Card className="col-span-3 border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Post Performance</CardTitle>
          <CardDescription>Daily reach and engagement overview</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3 border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Post Performance</CardTitle>
        <CardDescription>Daily reach and engagement overview</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.4)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
              stroke="oklch(var(--muted-foreground))"
              fontSize={11}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              stroke="oklch(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              stroke="oklch(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
                borderRadius: "var(--radius)",
                color: "oklch(var(--foreground))",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              labelFormatter={(label) => {
                try {
                  const date = new Date(label as string);
                  return date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                } catch {
                  return label;
                }
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="reach"
              name="Reach"
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="engagement"
              name="Engagement"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
