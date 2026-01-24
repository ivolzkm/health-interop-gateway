import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface QueueStats {
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface FailedJob {
  id: string;
  messageId: string;
  clientId: number;
  failedReason: string;
  failedAt: string;
  attempts: number;
}

/**
 * Queue Monitor Dashboard
 * Real-time monitoring of message processing queue
 */
export default function QueueMonitor() {
  const [stats, setStats] = useState<QueueStats>({
    active: 0,
    waiting: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  });
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // In a real implementation, these would call actual tRPC procedures
  // For now, we'll show the UI structure with mock data

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const totalPending = stats.active + stats.waiting + stats.delayed;
  const totalProcessed = stats.completed + stats.failed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of message processing queue
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Queue Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs currently processing
            </p>
          </CardContent>
        </Card>

        {/* Waiting Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs in queue
            </p>
          </CardContent>
        </Card>

        {/* Completed Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        {/* Failed Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing errors
            </p>
          </CardContent>
        </Card>

        {/* Delayed Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delayed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled for retry
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Health</CardTitle>
          <CardDescription>
            Overall queue performance and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold">{totalPending}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPending === 0 ? 'Queue is empty' : 'Jobs awaiting processing'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
              <p className="text-2xl font-bold">{totalProcessed}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed > 0 ? `${Math.round((stats.completed / totalProcessed) * 100)}% success rate` : 'No jobs processed yet'}
              </p>
            </div>
          </div>

          {/* Health Status */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Status</p>
            <div className="flex items-center gap-2">
              {stats.failed > 0 && stats.failed > stats.completed * 0.1 ? (
                <>
                  <Badge variant="destructive">Warning</Badge>
                  <span className="text-sm text-muted-foreground">
                    High failure rate detected
                  </span>
                </>
              ) : stats.active > 20 ? (
                <>
                  <Badge variant="secondary">Busy</Badge>
                  <span className="text-sm text-muted-foreground">
                    Queue is processing many jobs
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="default">Healthy</Badge>
                  <span className="text-sm text-muted-foreground">
                    Queue is operating normally
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs Table */}
      {failedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Jobs (Dead Letter Queue)</CardTitle>
            <CardDescription>
              Jobs that failed after all retry attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Job ID</th>
                    <th className="text-left py-2 px-4 font-medium">Message ID</th>
                    <th className="text-left py-2 px-4 font-medium">Error</th>
                    <th className="text-left py-2 px-4 font-medium">Attempts</th>
                    <th className="text-left py-2 px-4 font-medium">Failed At</th>
                  </tr>
                </thead>
                <tbody>
                  {failedJobs.map(job => (
                    <tr key={job.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-mono text-xs">{job.id.slice(0, 8)}...</td>
                      <td className="py-2 px-4 font-mono text-xs">{job.messageId}</td>
                      <td className="py-2 px-4">
                        <span className="text-red-600 text-xs">{job.failedReason}</span>
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant="outline">{job.attempts}</Badge>
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {new Date(job.failedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {failedJobs.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Jobs (Dead Letter Queue)</CardTitle>
            <CardDescription>
              Jobs that failed after all retry attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No failed jobs</p>
              <p className="text-sm text-muted-foreground mt-1">
                All jobs are processing successfully
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Configuration</CardTitle>
          <CardDescription>
            Current queue settings and parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Concurrency</p>
              <p className="text-lg font-semibold">5 jobs</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Attempts</p>
              <p className="text-lg font-semibold">3</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Backoff Delay</p>
              <p className="text-lg font-semibold">2s</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Job Timeout</p>
              <p className="text-lg font-semibold">5m</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
