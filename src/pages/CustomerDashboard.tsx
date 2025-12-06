import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Zap,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { stripeAPI, subscriptionAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  subscription: {
    plan: string;
    status: string;
    minutesRemaining: number;
    minutesPurchased: number;
    nextBillingDate: string | null;
  };
  business: {
    setupStatus: string;
    aiTrainingStatus: string;
    posIntegration: string;
    phoneNumber: string;
  };
  analytics: {
    callsToday: number;
    callsChangePercent: number;
    aiStatus: string;
    responseTime: number;
  };
  recentActivity: Array<{
    text: string;
    timeAgo: string;
    createdAt: string;
  }>;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true,
      });
      setDashboardData(response.data);
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds (reduced from 5s to minimize server load)
    // Only refresh if component is still mounted
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 30000); // 30 seconds instead of 5
    
    return () => clearInterval(interval);
  }, []);

  const handleBuyMoreCredits = async () => {
    try {
      const { url } = await stripeAPI.createCheckoutSession({
        priceId: "price_credits_addon",
        planName: "Additional Credits",
        credits: 100,
      });
      if (url) window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to process request. Please ensure the backend is running.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCancel = async () => {
    try {
      await stripeAPI.cancelSubscription();
      toast({ title: "Subscription will cancel at period end" });
      // Refresh dashboard data
      await fetchDashboardData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await stripeAPI.createPortalSession();
      if (url) window.location.href = url;
    } catch {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  if (loading || !user || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { subscription, business, analytics, recentActivity } = dashboardData;
  const total = subscription?.minutesPurchased || 0;
  const remaining = subscription?.minutesRemaining || 0;
  const creditPercentage = total ? (remaining / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onSignInClick={() => {}} 
        onSignUpClick={() => {}}
        onBookDemoClick={() => {}} 
      />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Free Plan Alert */}
          {(!subscription?.plan || subscription?.plan === "Free" || subscription?.status === "inactive") && (
            <Card className="border-yellow-500/50 bg-yellow-500/10 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Zap className="w-5 h-5" />
                  You're on the Free Plan
                </CardTitle>
                <CardDescription className="text-foreground/80">
                  Upgrade to unlock AI voice features and get minutes for your
                  calls. Choose a plan that fits your needs!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  View Plans & Upgrade
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ===================== AI PHONE MANAGER OVERVIEW ===================== */}
          <Card className="border-primary/30 bg-card/40 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                OWN CUSTOM AI PHONE MANAGER
              </CardTitle>
              <CardDescription>
                Manage your AI-powered business operations
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Business Setup</p>
                  <p className="text-lg font-semibold text-success">
                    {business.setupStatus === 'complete' ? 'Complete ✅' : 'Incomplete'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">AI Training</p>
                  <p className="text-lg font-semibold text-success">
                    {business.aiTrainingStatus === 'complete' ? 'Complete ✅' : 'Incomplete'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">POS Integration</p>
                  <p className="text-lg font-semibold text-success">
                    {business.posIntegration === 'complete' ? 'Complete ✅' : 'Incomplete'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Phone Number Setup</p>
                  <p className="text-lg font-semibold text-primary">{business.phoneNumber}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="p-5 rounded-xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/10 to-transparent flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Configure Your Second Business
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add another business to your AI phone manager
                  </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </div>

                <div className="flex-1 p-5 rounded-xl border border-border bg-muted/30">
                  <h3 className="text-lg font-semibold mb-3">Analytics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{analytics.callsToday}</p>
                      <p className="text-sm text-muted-foreground">Calls Today</p>
                      <p className="text-xs text-green-500 font-medium">
                        {analytics.callsChangePercent > 0 ? '+' : ''}{analytics.callsChangePercent}% vs yesterday
                      </p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${analytics.aiStatus === 'Online' ? 'text-success' : 'text-muted-foreground'}`}>
                        {analytics.aiStatus}
                      </p>
                      <p className="text-sm text-muted-foreground">AI Status</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.responseTime}s</p>
                      <p className="text-sm text-muted-foreground">Response Time</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-5 rounded-xl border border-border bg-muted/30">
                <h3 className="text-lg font-semibold mb-2">Recent AI Activity</h3>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="pb-3 border-b border-border last:border-0 last:pb-0">
                        <p className="text-sm">{activity.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.timeAgo}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
          {/* ===================================================================== */}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {subscription?.plan || "Free"}
                </div>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {subscription?.status || "inactive"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Credits Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{remaining}</div>
                <p className="text-sm text-muted-foreground mt-1">of {total} total</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Next Renewal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {subscription?.nextBillingDate
                    ? new Date(subscription.nextBillingDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-renewal enabled
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.max(total - remaining, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Credits used</p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Usage */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Credit Usage</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {creditPercentage.toFixed(1)}% remaining
                </span>
              </CardTitle>
              <CardDescription>
                You have {remaining} credits left for this billing cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={creditPercentage} className="h-3" />
              <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                <span>0 credits</span>
                <span>{total} credits</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-border bg-card/30 backdrop-blur-xl hover:bg-card/50 transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  Upgrade Your Plan
                </CardTitle>
                <CardDescription>
                  Get more credits and unlock advanced features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  View Plans
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl hover:bg-card/50 transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Plus className="w-6 h-6 text-secondary" />
                  </div>
                  Buy Additional Credits
                </CardTitle>
                <CardDescription>
                  Need more credits? Purchase them separately
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleBuyMoreCredits}
                  variant="outline"
                  className="w-full border-secondary text-secondary hover:bg-secondary/10"
                >
                  Buy 100 Credits
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings */}
          {/* <Card className="border-border bg-card/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div>
                  <p className="font-semibold">Subscription Status</p>
                  <p className="text-sm text-muted-foreground">{subscription?.status}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium capitalize">
                  {subscription?.status}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div>
                  <p className="font-semibold">Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    •••• •••• •••• 4242
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </section>

      <Footer onBookDemoClick={() => {}} />
    </div>
  );
};

export default CustomerDashboard;
