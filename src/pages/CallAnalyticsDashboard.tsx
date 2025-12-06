import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, TrendingUp, Clock, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import callAnalyticsAPI, { DashboardStatsData } from "@/services/callAnalyticsAPI";

const CallAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [statsData, setStatsData] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Footer />
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
                  {recentCalls.map((call) => (
                    <div
                      key={call.callId}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{call.phoneNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {call.durationMinutes} min
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {call.summaryPreview || 'No summary available'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.timeAgo}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Could navigate to call details page
                          toast({
                            title: "Call Details",
                            description: `Call ID: ${call.callId}`,
                          });
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CallAnalyticsDashboard;
