import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedClientId] = useState(1);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsQuery = trpc.dashboard.getStats.useQuery({
    clientId: selectedClientId,
    days: 30,
  });

  const alertsQuery = trpc.dashboard.getAlerts.useQuery({
    clientId: selectedClientId,
  });

  const messagesQuery = trpc.dashboard.getRecentMessages.useQuery({
    clientId: selectedClientId,
    limit: 20,
  });

  const auditLogsQuery = trpc.dashboard.getAuditLogs.useQuery({
    clientId: selectedClientId,
    limit: 50,
  });

  const stats = statsQuery.data || [];
  const alerts = alertsQuery.data || [];
  const messages = messagesQuery.data || [];
  const auditLogs = auditLogsQuery.data || [];

  const totalMessages = stats.reduce((sum, s) => sum + s.messagesReceived, 0);
  const processedMessages = stats.reduce((sum, s) => sum + s.messagesProcessed, 0);
  const failedMessages = stats.reduce((sum, s) => sum + s.messagesFailed, 0);
  const avgProcessingTime = stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.averageProcessingTime, 0) / stats.length) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Healthcare Integration Dashboard</h1>
          <p className="text-muted-foreground">Monitor your healthcare data integration status and performance</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{processedMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully transformed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">Validation errors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Avg Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgProcessingTime}ms</div>
              <p className="text-xs text-muted-foreground mt-1">Processing time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts">
              Alerts
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p>No active alerts</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={alert.severity === 'critical' ? 'border-red-600' : 'border-yellow-600'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{alert.title}</CardTitle>
                        <CardDescription>{alert.description}</CardDescription>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Type: <span className="font-mono">{alert.alertType}</span>
                    </p>
                    {alert.details && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(JSON.parse(alert.details), null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No messages found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <Card key={msg.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-mono text-sm">{msg.messageId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={msg.status === 'transformed' ? 'default' : 'secondary'}>
                        {msg.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            {auditLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No audit logs found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          Resource: {log.resourceType} ({log.resourceId})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        {log.description && (
                          <p className="text-sm mt-1">{log.description}</p>
                        )}
                      </div>
                      {log.ipAddress && (
                        <Badge variant="outline" className="text-xs">
                          {log.ipAddress}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
                <CardDescription>Last 30 days statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.length === 0 ? (
                  <p className="text-muted-foreground">No performance data available</p>
                ) : (
                  <div className="space-y-4">
                    {stats.map((stat) => (
                      <div key={stat.id} className="border-l-2 border-primary pl-4">
                        <p className="font-semibold text-sm">{stat.date}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Received</p>
                            <p className="font-bold">{stat.messagesReceived}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Processed</p>
                            <p className="font-bold text-green-600">{stat.messagesProcessed}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Failed</p>
                            <p className="font-bold text-red-600">{stat.messagesFailed}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Time</p>
                            <p className="font-bold">{stat.averageProcessingTime}ms</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
