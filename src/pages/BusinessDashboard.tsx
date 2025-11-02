import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Phone,
  Brain,
  Link2,
  Settings,
  TrendingUp,
  Activity,
  Clock,
  Plus,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { authService, Business } from "@/lib/auth";
import SubscriptionRequired from "@/components/SubscriptionRequired";
import { stripeAPI } from "@/services/api";

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [business, setBusiness] = useState(authService.getActiveBusiness());
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/");
      toast({
        title: "Authentication Required",
        description: "Please sign in to access your dashboard.",
        variant: "destructive",
      });
      return;
    }

    // Check for successful Stripe payment
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const success = urlParams.get("success");

    if (sessionId && success === "true") {
      // Activate subscription after successful payment
      handleStripeSuccess(sessionId);
      // Clean URL
      window.history.replaceState({}, "", "/business-dashboard");
    } else {
      // Check subscription
      const hasActiveSub = authService.hasActiveSubscription();
      setHasSubscription(hasActiveSub);

      if (!hasActiveSub) {
        setIsLoading(false);
        return;
      }
    }

    setUser(authService.getCurrentUser());
    setBusiness(authService.getActiveBusiness());
    setIsLoading(false);
  }, [navigate, toast]);

  const handleStripeSuccess = async (sessionId: string) => {
    try {
      // Call backend to activate subscription
      const data = await stripeAPI.activateSubscription(sessionId);
      if (data.success) {
        // Activate subscription in localStorage
        authService.activateSubscription(
          data.plan,
          data.customerId,
          data.subscriptionId
        );

        // Update local state
        setHasSubscription(true);
        setUser(authService.getCurrentUser());
        setBusiness(authService.getActiveBusiness());

        toast({
          title: "Subscription Activated! 🎉",
          description: `Welcome to ${data.plan} plan. Your business dashboard is ready!`,
        });
      } else {
        throw new Error(data.message || "Failed to activate subscription");
      }
    } catch (error) {
  console.error("Subscription activation error:", error);
      toast({
        title: "Activation Error",
        description: "Failed to activate subscription. Please contact support.",
        variant: "destructive",
      });
      navigate("/pricing");
    }
  };

  const handleLogout = () => {
    authService.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleSwitchBusiness = (businessId: string) => {
    authService.switchBusiness(businessId);
    setUser(authService.getCurrentUser());
    setBusiness(authService.getActiveBusiness());
    toast({
      title: "Business Switched",
      description: "You're now managing a different business.",
    });
  };

  const handleSetupStep = (step: keyof Business["setupSteps"]) => {
    authService.updateSetupStep(step, true);
    setUser(authService.getCurrentUser());
    setBusiness(authService.getActiveBusiness());
    toast({
      title: "Step Completed!",
      description: `${step.replace(/([A-Z])/g, " $1").trim()} completed successfully.`,
    });
  };

  const handleAddBusiness = () => {
    const newBusiness = authService.addBusiness({
      name: "New Business",
      type: "business",
    });
    setUser(authService.getCurrentUser());
    setBusiness(authService.getActiveBusiness());
    toast({
      title: "Business Added!",
      description: "Your new business has been created. Complete the setup to get started.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show subscription required page if no active subscription
  if (!hasSubscription) {
    return <SubscriptionRequired />;
  }

  if (!user || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load business data.</p>
        </div>
      </div>
    );
  }

  const setupProgress = Object.values(business.setupSteps).filter((v) => v).length * 25;
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const setupSteps = [
    {
      key: "businessInfo" as const,
      title: "Business Setup",
      description: "Complete your business information",
      icon: Settings,
      completed: business.setupSteps.businessInfo,
    },
    {
      key: "aiTraining" as const,
      title: "AI Training",
      description: "Train AI with your menu and policies",
      icon: Brain,
      completed: business.setupSteps.aiTraining,
    },
    {
      key: "posIntegration" as const,
      title: "POS Integration",
      description: "Connect your Point of Sale system",
      icon: Link2,
      completed: business.setupSteps.posIntegration,
    },
    {
      key: "phoneSetup" as const,
      title: "Phone Number Setup",
      description: "Configure your business phone number",
      icon: Phone,
      completed: business.setupSteps.phoneSetup,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">OWN CUSTOM AI PHONE MANAGER</h1>
                <p className="text-sm text-muted-foreground">Manage your AI-powered business operations</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {business.name}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  {user.businesses.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => handleSwitchBusiness(b.id)}
                      className="cursor-pointer"
                    >
                      {b.name}
                      {b.id === business.id && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={handleAddBusiness} className="cursor-pointer text-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Business
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Setup Progress */}
        {!business.setupComplete && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Complete Your Setup</CardTitle>
                  <CardDescription>
                    {setupProgress}% complete - {4 - Object.values(business.setupSteps).filter((v) => v).length} steps
                    remaining
                  </CardDescription>
                </div>
                <div className="text-3xl font-bold text-primary">{setupProgress}%</div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={setupProgress} className="h-3 mb-6" />
              <div className="grid md:grid-cols-2 gap-4">
                {setupSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Card
                      key={step.key}
                      className={`border-border ${
                        step.completed ? "bg-success/10" : "bg-card/50"
                      } hover:bg-muted/50 transition-all cursor-pointer`}
                      onClick={() => !step.completed && handleSetupStep(step.key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              step.completed ? "bg-success/20" : "bg-muted"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : (
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{step.title}</h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {!step.completed && (
                              <Button size="sm" className="mt-2" variant="outline">
                                Configure
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border bg-card/30 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Calls Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{business.analytics.callsToday}</div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className={business.analytics.callsTrend > 0 ? "text-success" : "text-destructive"}>
                  {business.analytics.callsTrend > 0 ? "+" : ""}
                  {business.analytics.callsTrend}%
                </span>{" "}
                vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/30 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                <div className="text-2xl font-bold capitalize">{business.analytics.aiStatus}</div>
              </div>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/30 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{business.analytics.responseTime}</div>
              <p className="text-sm text-muted-foreground mt-1">Average response</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent AI Activity
            </CardTitle>
            <CardDescription>Latest interactions handled by your AI phone manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {business.recentActivity.slice(0, 5).map((activity, idx) => {
                const timeAgo = Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 60000);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold capitalize">{activity.type} {activity.status === "completed" ? "taken" : "pending"}</h4>
                        <span className="text-sm text-muted-foreground">
                          {timeAgo < 60 ? `${timeAgo} minutes ago` : `${Math.floor(timeAgo / 60)} hours ago`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.amount && <p className="text-sm font-semibold text-success mt-1">{activity.amount}</p>}
                    </div>
                    <Badge
                      variant={activity.status === "completed" ? "default" : "secondary"}
                      className={activity.status === "completed" ? "bg-success/20 text-success" : ""}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Add Second Business CTA */}
        {user.businesses.length === 1 && (
          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent backdrop-blur-xl mt-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Configure Your Second Business</h3>
              <p className="text-muted-foreground mb-6">
                Add another business to your AI phone manager
              </p>
              <Button onClick={handleAddBusiness} className="bg-secondary hover:bg-secondary/90">
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
