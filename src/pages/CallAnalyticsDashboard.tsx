import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, TrendingUp, Clock, Activity, AlertCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import callAnalyticsAPI, { DashboardStatsData, CallRecord } from "@/services/callAnalyticsAPI";

const CallAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [statsData, setStatsData] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [fullCallData, setFullCallData] = useState<Map<string, any>>(new Map());

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      // Use userId from user object or _id
      const userId = (user as any).userId || (user as any)._id;
      const response = await callAnalyticsAPI.getDashboardStats(userId);
      
      if (response.success) {
        setStatsData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load call analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCallExpansion = async (callId: string) => {
    const newExpanded = new Set(expandedCalls);
    
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
      setExpandedCalls(newExpanded);
    } else {
      newExpanded.add(callId);
      setExpandedCalls(newExpanded);
      
      // Fetch full call data if not already loaded
      if (!fullCallData.has(callId)) {
        try {
          const response = await callAnalyticsAPI.getCallById(callId);
          if (response.success) {
            const newMap = new Map(fullCallData);
            newMap.set(callId, response.data.call);
            setFullCallData(newMap);
          }
        } catch (error) {
          console.error('Failed to load call details:', error);
          toast({
            title: "Error",
            description: "Failed to load call transcript",
            variant: "destructive",
          });
        }
      }
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onSignInClick={() => {}} onSignUpClick={() => {}} onBookDemoClick={() => {}} />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-7xl text-center">
            <h2 className="text-2xl font-bold mb-4">No Analytics Data</h2>
            <p className="text-muted-foreground">Start making calls to see your analytics here.</p>
          </div>
        </div>
        <Footer onBookDemoClick={() => navigate('/demo')} />
      </div>
    );
  }

  const { callAnalytics, subscription, recentCalls, alerts } = statsData;
  const creditPercentage = subscription.totalCredits 
    ? (subscription.availableCredits / subscription.totalCredits) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation onSignInClick={() => {}} onSignUpClick={() => {}} onBookDemoClick={() => {}} />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Call Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track your AI call performance and subscription</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {/* Alerts */}
          {alerts.noCredits && (
            <Card className="border-red-500/50 bg-red-500/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  No Credits Remaining
                </CardTitle>
                <CardDescription>
                  Your subscription has run out of credits. Add more credits to continue making calls.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/pricing')}>Add Credits</Button>
              </CardContent>
            </Card>
          )}

          {alerts.lowBalance && !alerts.noCredits && (
            <Card className="border-yellow-500/50 bg-yellow-500/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  Low Balance Warning
                </CardTitle>
                <CardDescription>
                  {alerts.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/pricing')} variant="outline">
                  Add More Credits
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Calls */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{callAnalytics.totalCalls}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {callAnalytics.totalMinutesUsed} total minutes
                </p>
              </CardContent>
            </Card>

            {/* Calls Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{callAnalytics.callsToday}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {callAnalytics.callsChangePercent > 0 ? '+' : ''}{callAnalytics.callsChangePercent.toFixed(1)}% from yesterday
                </p>
              </CardContent>
            </Card>

            {/* Average Duration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{callAnalytics.averageDuration.toFixed(1)} min</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per call average
                </p>
              </CardContent>
            </Card>

            {/* Credits Remaining */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Credits Left</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscription.availableCredits} min</div>
                <p className="text-xs text-muted-foreground mt-1">
                  of {subscription.totalCredits} minutes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>
                    Plan: {subscription.planName} ({subscription.planType})
                  </CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Minutes Used</span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usedCredits} / {subscription.totalCredits} minutes
                    </span>
                  </div>
                  <Progress value={creditPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {subscription.availableCredits} minutes remaining
                  </p>
                </div>

                {subscription.renewalDate && (
                  <p className="text-sm text-muted-foreground">
                    Next renewal: {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Calls */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Your latest call analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No calls yet. Start making calls to see them here.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentCalls.map((call) => {
                    const isExpanded = expandedCalls.has(call.callId);
                    const fullCall = fullCallData.get(call.callId);
                    
                    return (
                      <div
                        key={call.callId}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{call.phoneNumber}</span>
                              <Badge variant="outline" className="text-xs">
                                {call.durationMinutes} min
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {call.status}
                              </Badge>
                            </div>
                            
                            {/* Summary */}
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Summary
                              </p>
                              <p className="text-sm text-foreground">
                                {call.summaryPreview || 'No summary available'}
                              </p>
                            </div>

                            {/* Transcript Preview/Full */}
                            {isExpanded && fullCall ? (
                              <div className="mt-3 p-3 bg-muted/30 rounded-md border border-border">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                                  Full Transcript
                                </p>
                                <div className="text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                                  {fullCall.transcript || 'No transcript available'}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  {call.transcriptPreview?.substring(0, 100)}
                                  {call.transcriptPreview?.length > 100 ? '...' : ''}
                                </p>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              {call.timeAgo} • Call ID: {call.callId}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCallExpansion(call.callId)}
                            className="ml-4"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Expand
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer onBookDemoClick={() => navigate('/demo')} />
    </div>
  );
};

export default CallAnalyticsDashboard;
