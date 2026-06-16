"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  ShieldAlert, 
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type JobInfo = {
  id: string;
  name: string;
  data: unknown;
  failedReason?: string;
  finishedOn?: string | null;
  processedOn?: string | null;
  timestamp?: string | null;
};

type QueueDetail = {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  failed: JobInfo[];
  active: JobInfo[];
  delayed: JobInfo[];
};

type DLQJob = {
  id: string;
  name: string;
  data: {
    postId: string;
    attempts: number;
    failedAt: string;
    failedTargets: Array<{
      targetId: string;
      platform: string;
      error: string;
    }>;
  };
  timestamp: string | null;
};

type MonitorData = {
  queues: QueueDetail[];
  dlq: {
    counts: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    jobs: DLQJob[];
  };
};

export default function QueueMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/queues");
      if (!res.ok) {
        throw new Error("Failed to load queue metrics.");
      }
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load background job queue metrics.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const handleRetryJob = async (queueName: string, jobId: string) => {
    const actionKey = `${queueName}:${jobId}`;
    setActionInProgress(actionKey);
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", queueName, jobId }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to retry job.");
      }

      toast.success(`Job successfully retried on queue: ${queueName}`);
      fetchMetrics(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retry job.";
      toast.error(message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetryDLQ = async (jobId: string, postId: string) => {
    const actionKey = `dlq:${jobId}`;
    setActionInProgress(actionKey);
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry-dlq", jobId }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to recover post from DLQ.");
      }

      toast.success(`Post successfully recovered and queued for publishing!`);
      fetchMetrics(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retry DLQ post.";
      toast.error(message);
    } finally {
      setActionInProgress(null);
    }
  };

  const getJobStatusBadge = (counts: QueueDetail["counts"]) => {
    const total = counts.waiting + counts.active + counts.delayed + counts.failed;
    if (counts.failed > 0) return <Badge variant="destructive">Needs Attention</Badge>;
    if (counts.active > 0) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Active</Badge>;
    if (total === 0) return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Idle</Badge>;
    return <Badge variant="secondary">Queued</Badge>;
  };

  const formatQueueName = (name: string) => {
    return name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Queue Monitor</h2>
          <p className="text-muted-foreground text-sm">
            Monitor background jobs, publish attempts, comment polling, and recover failed items from the Dead Letter Queue.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center space-x-2 border rounded-xl px-3 py-1.5 bg-muted/30">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-xs font-semibold cursor-pointer">
              Auto-refresh (5s)
            </Label>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchMetrics()} 
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-dashed">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Connecting to Redis queues...</p>
          </div>
        </div>
      ) : data ? (
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg font-semibold text-xs">Overview</TabsTrigger>
            <TabsTrigger value="queues" className="rounded-lg font-semibold text-xs">Job Queues</TabsTrigger>
            <TabsTrigger value="dlq" className="rounded-lg font-semibold text-xs relative">
              Dead Letter Queue (DLQ)
              {data.dlq.jobs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                  {data.dlq.jobs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.queues.map((q) => (
                <Card key={q.name} className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold">{formatQueueName(q.name)}</CardTitle>
                    {getJobStatusBadge(q.counts)}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-muted-foreground">Active</span>
                        <span className="text-lg font-extrabold text-foreground">{q.counts.active}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-muted-foreground">Waiting</span>
                        <span className="text-lg font-extrabold text-foreground">{q.counts.waiting}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-destructive">Failed</span>
                        <span className={`text-lg font-extrabold ${q.counts.failed > 0 ? "text-destructive" : "text-foreground"}`}>
                          {q.counts.failed}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* DLQ Summary Banner */}
            {data.dlq.jobs.length > 0 ? (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Action Required: Dead Letter Queue is populated</h4>
                  <p className="text-xs text-destructive/80">
                    We found {data.dlq.jobs.length} permanently failed post attempts in the DLQ. These posts failed all automatic publishing retries.
                    You can view failure details and re-enqueue them in the Dead Letter Queue tab.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">System Healthy</h4>
                  <p className="text-xs text-muted-foreground">
                    All background publishing queues are operating normally. Dead Letter Queue is empty.
                  </p>
                </div>
              </div>
            )}

            {/* Active and Failed Jobs Overview */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Play className="size-4 text-emerald-500" />
                    <CardTitle className="text-sm font-bold">Active Jobs ({data.queues.reduce((acc, q) => acc + q.counts.active, 0)})</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Jobs currently being executed by the background process.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold px-4">Queue</TableHead>
                        <TableHead className="text-xs font-bold px-4">Job ID</TableHead>
                        <TableHead className="text-xs font-bold px-4">Payload Info</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.queues.every((q) => q.active.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs">
                            No active jobs running currently.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.queues.flatMap((q) => 
                          q.active.map((job) => (
                            <TableRow key={`${q.name}:${job.id}`}>
                              <TableCell className="font-semibold text-xs px-4">{formatQueueName(q.name)}</TableCell>
                              <TableCell className="font-mono text-[11px] text-muted-foreground px-4">{job.id}</TableCell>
                              <TableCell className="text-xs text-muted-foreground px-4 truncate max-w-[200px]">
                                {JSON.stringify(job.data)}
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-destructive" />
                    <CardTitle className="text-sm font-bold">Recent Failures ({data.queues.reduce((acc, q) => acc + q.counts.failed, 0)})</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Failed jobs awaiting automatic retry or inspection.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold px-4">Queue</TableHead>
                        <TableHead className="text-xs font-bold px-4">Error Reason</TableHead>
                        <TableHead className="text-xs font-bold px-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.queues.every((q) => q.failed.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs">
                            No active failures in the main queues.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.queues.flatMap((q) => 
                          q.failed.map((job) => (
                            <TableRow key={`${q.name}:${job.id}`}>
                              <TableCell className="font-semibold text-xs px-4">{formatQueueName(q.name)}</TableCell>
                              <TableCell className="text-xs text-destructive px-4 max-w-[180px] truncate" title={job.failedReason}>
                                {job.failedReason || "Unknown failure."}
                              </TableCell>
                              <TableCell className="text-right px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetryJob(q.name, job.id)}
                                  disabled={actionInProgress === `${q.name}:${job.id}`}
                                  className="h-8 rounded-lg text-primary text-xs hover:text-primary hover:bg-primary/5 font-semibold"
                                >
                                  <RotateCcw className={`size-3.5 mr-1 ${actionInProgress === `${q.name}:${job.id}` ? "animate-spin" : ""}`} />
                                  Retry
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Job Queues Detail Tab */}
          <TabsContent value="queues" className="space-y-6">
            {data.queues.map((q) => (
              <Card key={q.name} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                  <div>
                    <CardTitle className="text-base font-bold">{formatQueueName(q.name)} Queue</CardTitle>
                    <CardDescription className="text-xs">Full jobs listing for the {q.name} process.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      Waiting: {q.counts.waiting}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold text-indigo-500 border-indigo-500/20">
                      Delayed: {q.counts.delayed}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold px-4">Job ID</TableHead>
                        <TableHead className="text-xs font-bold px-4">Payload Data</TableHead>
                        <TableHead className="text-xs font-bold px-4">Status / Issue</TableHead>
                        <TableHead className="text-xs font-bold px-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {q.active.length === 0 && q.failed.length === 0 && q.delayed.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                            No active, failed, or delayed jobs present in this queue.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {/* Active */}
                          {q.active.map((job) => (
                            <TableRow key={`${q.name}:${job.id}`}>
                              <TableCell className="font-mono text-[11px] px-4">{job.id}</TableCell>
                              <TableCell className="text-xs text-muted-foreground px-4 truncate max-w-[250px]">
                                {JSON.stringify(job.data)}
                              </TableCell>
                              <TableCell className="px-4">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">Processing</Badge>
                              </TableCell>
                              <TableCell className="text-right px-4">-</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Delayed */}
                          {q.delayed.map((job) => (
                            <TableRow key={`${q.name}:${job.id}`}>
                              <TableCell className="font-mono text-[11px] px-4">{job.id}</TableCell>
                              <TableCell className="text-xs text-muted-foreground px-4 truncate max-w-[250px]">
                                {JSON.stringify(job.data)}
                              </TableCell>
                              <TableCell className="px-4">
                                <Badge variant="secondary" className="text-[10px]">
                                  Scheduled: {job.timestamp ? new Date(job.timestamp).toLocaleTimeString() : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right px-4">-</TableCell>
                            </TableRow>
                          ))}

                          {/* Failed */}
                          {q.failed.map((job) => (
                            <TableRow key={`${q.name}:${job.id}`} className="bg-destructive/5 hover:bg-destructive/10 transition-colors">
                              <TableCell className="font-mono text-[11px] px-4">{job.id}</TableCell>
                              <TableCell className="text-xs text-muted-foreground px-4 truncate max-w-[250px]">
                                {JSON.stringify(job.data)}
                              </TableCell>
                              <TableCell className="text-xs text-destructive px-4 max-w-[200px] truncate" title={job.failedReason}>
                                {job.failedReason || "Failed attempt."}
                              </TableCell>
                              <TableCell className="text-right px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetryJob(q.name, job.id)}
                                  disabled={actionInProgress === `${q.name}:${job.id}`}
                                  className="h-8 rounded-lg text-primary text-xs hover:text-primary hover:bg-primary/5 font-semibold"
                                >
                                  <RotateCcw className={`size-3.5 mr-1 ${actionInProgress === `${q.name}:${job.id}` ? "animate-spin" : ""}`} />
                                  Retry
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* DLQ Tab */}
          <TabsContent value="dlq" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-destructive" />
                  <CardTitle className="text-base font-bold">Dead Letter Queue (DLQ)</CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Contains jobs that have failed all configured retries. Posts in the DLQ are held indefinitely until retried or deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold px-4">Post ID</TableHead>
                      <TableHead className="text-xs font-bold px-4">Attempts</TableHead>
                      <TableHead className="text-xs font-bold px-4">Failed Platform Targets & Error Logs</TableHead>
                      <TableHead className="text-xs font-bold px-4">Failure Time</TableHead>
                      <TableHead className="text-xs font-bold px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dlq.jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="size-8 text-emerald-500" />
                            <p className="font-semibold">No jobs in DLQ!</p>
                            <p className="text-[11px]">All publishing failures were recovered or successfully posted.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.dlq.jobs.map((job) => (
                        <TableRow key={`dlq:${job.id}`} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs px-4 text-foreground font-semibold">
                            {job.data.postId}
                          </TableCell>
                          <TableCell className="px-4">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {job.data.attempts || 3}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 max-w-[350px]">
                            <div className="flex flex-col gap-1.5">
                              {job.data.failedTargets && job.data.failedTargets.length > 0 ? (
                                job.data.failedTargets.map((target) => (
                                  <div key={target.targetId} className="flex flex-col border-l-2 border-destructive/40 pl-2 py-0.5">
                                    <span className="text-[10px] font-bold uppercase text-destructive tracking-wide">
                                      {target.platform}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate" title={target.error}>
                                      {target.error}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">No target failure logs.</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground px-4">
                            {job.data.failedAt ? new Date(job.data.failedAt).toLocaleString() : "Unknown"}
                          </TableCell>
                          <TableCell className="text-right px-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRetryDLQ(job.id, job.data.postId)}
                              disabled={actionInProgress === `dlq:${job.id}`}
                              className="h-8 rounded-lg bg-primary text-xs hover:brightness-105 font-semibold text-primary-foreground"
                            >
                              <Play className={`size-3.5 mr-1 ${actionInProgress === `dlq:${job.id}` ? "animate-spin" : ""}`} />
                              Retry & Publish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-dashed text-muted-foreground text-sm">
          No metrics available. Please check system logging.
        </div>
      )}
    </div>
  );
}
