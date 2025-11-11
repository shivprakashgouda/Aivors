import { useState } from "react";
import { Check, Zap, Rocket, Crown, Building, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SignInModal } from "@/components/SignInModal";
import { stripeAPI } from "@/services/api";

const plansData = [
  {
    name: "Starter",
    monthly: {
      price: "$50",
      originalPrice: null,
      priceId: "price_starter_monthly",
      discount: null,
    },
    yearly: {
      price: "$500",
      originalPrice: "$600",
      priceId: "price_starter_yearly",
      discount: "-17%",
    },
    minutes: "100 mins",
    concurrentCalls: "5 Concurrent Calls",
    workflows: null,
    icon: Zap,
    features: [
      "Voice API, LLM, transcriber costs",
      "Unlimited Assistants",
      "API & Integrations",
      "Real-Time Booking, Human Transfer & More Actions",
      "Voice AI Courses & Community Support"
    ],
    popular: false,
    trialText: null,
  },
  {
    name: "Pro",
    monthly: {
      price: "$375",
      originalPrice: null,
      priceId: "price_pro_monthly",
      discount: null,
    },
    yearly: {
      price: "$3,750",
      originalPrice: "$4,500",
      priceId: "price_pro_yearly",
      discount: "-17%",
    },
    minutes: "2,000 mins, then $0.13/min",
    concurrentCalls: "25 Concurrent Calls",
    workflows: "8,000 Custom Workflows",
    icon: Rocket,
    features: [
      "Everything in Starter",
      "Workflow Builder",
      "Team Access",
      "Support via Ticketing"
    ],
    popular: true,
    trialText: "Try 14-Day Free",
  },
  {
    name: "Growth",
    monthly: {
      price: "$750",
      originalPrice: "$900",
      priceId: "price_growth_monthly",
      discount: "-17%",
    },
    yearly: {
      price: "$7,500",
      originalPrice: "$10,800",
      priceId: "price_growth_yearly",
      discount: "-31%",
    },
    minutes: "4,000 mins, then $0.12/min",
    concurrentCalls: "50 Concurrent Calls",
    workflows: "42,000 Custom Workflows",
    subaccounts: "25 Subaccounts",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Rebilling",
      "Access to New Features",
      "Support via Ticketing"
    ],
    popular: false,
    trialText: "Try 14-Day Free",
  },
  {
    name: "Agency",
    monthly: {
      price: "$1,250",
      originalPrice: "$1,400",
      priceId: "price_agency_monthly",
      discount: "-11%",
    },
    yearly: {
      price: "$12,500",
      originalPrice: "$16,800",
      priceId: "price_agency_yearly",
      discount: "-26%",
    },
    minutes: "6,000 mins, then $0.12/min",
    concurrentCalls: "80 Concurrent Calls",
    workflows: "100,000 Custom Workflows",
    subaccounts: "Unlimited Subaccounts",
    icon: Building,
    features: [
      "White Label Platform",
      "30-Day Onboarding & Private Slack Channel",
      "Support via Ticketing"
    ],
    popular: false,
    trialText: "Try 14-Day Free",
  },
  {
    name: "Enterprise",
    monthly: {
      price: "Custom",
      originalPrice: null,
      priceId: "price_enterprise_custom",
      discount: null,
    },
    yearly: {
      price: "Custom",
      originalPrice: null,
      priceId: "price_enterprise_custom_yearly",
      discount: null,
    },
    minutes: "Volume-based Price, as low as $0.08/min",
    concurrentCalls: "200+ Concurrent Calls",
    workflows: null,
    icon: Star,
    features: [
      "SIP Trunk Integration",
      "Guaranteed Uptime (SLA)",
      "Custom Integrations",
      "Compliance (SOC2, HIPAA, GDPR)",
      "Solution Architect",
      "Enterprise Onboarding, Training, Support"
    ],
    popular: false,
    trialText: "Contact us",
    isCustom: true,
  },
];

export const PricingSection = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Generate plans based on current billing cycle
  const plans = plansData.map(plan => {
    const currentPricing = plan[billingCycle];
    return {
      ...plan,
      price: currentPricing.price,
      originalPrice: currentPricing.originalPrice,
      priceId: currentPricing.priceId,
      discount: currentPricing.discount,
      period: billingCycle === 'monthly' ? 'month' : 'year',
    };
  });

  const handleSubscribe = async (priceId: string, planName: string) => {
    // For Enterprise, redirect to contact
    if (planName === "Enterprise") {
      // You can replace this with your contact form or email
      window.location.href = "mailto:contact@yourcompany.com?subject=Enterprise Plan Inquiry";
      return;
    }

    // Check authentication first
    if (!isAuthenticated) {
      setShowSignIn(true);
      return;
    }

    setIsLoading(priceId);
    
    try {
      // Call backend to create Stripe checkout session using API service
      const { url } = await stripeAPI.createCheckoutSession({
        priceId,
        planName,
      });
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      
      // Check if it's a specific error response
      let title = "Checkout Error";
      let description = "Unable to create checkout session";
      
      // Handle network/fetch errors
      if (error.message === 'Network Error' || error.message?.includes('Failed to fetch')) {
        title = "Connection Error";
        description = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.code === 'ECONNABORTED') {
        title = "Request Timeout";
        description = "The request took too long. Please try again.";
      } else if (error.response?.status === 401) {
        title = "Authentication Required";
        description = "Please log in to continue with your purchase.";
        setShowSignIn(true);
      } else if (error.response?.status === 403) {
        title = "Authentication Required";
        description = "Please log in to continue with your purchase.";
        setShowSignIn(true);
      } else if (error.response?.status === 500 && error.response?.data?.error === 'Stripe not configured') {
        title = "Stripe Configuration Required";
        description = error.response.data.message || "Please set up your Stripe API keys in the server/.env file.";
      } else if (error.response?.data?.message) {
        description = error.response.data.message;
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-card/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Pricing That Scales <span className="text-primary">With You</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            As your business expands, our pricing adjusts to match your evolving needs, ensuring cost-efficiency without compromise
          </p>
        </div>

        {/* Pricing Toggle - Monthly/Yearly */}
        <div className="flex justify-center mb-12">
          <div className="bg-muted rounded-lg p-1 inline-flex relative">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 relative ${
                billingCycle === 'yearly' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                Save
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 ${
                  plan.popular
                    ? "border-primary bg-gradient-to-b from-primary/5 to-transparent ring-2 ring-primary/20"
                    : "border-border bg-card/50 hover:bg-card/70"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Discount Badge */}
                {plan.discount && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {plan.discount}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold mb-3 text-center">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center min-h-[40px]">
                    {plan.name === "Starter" && "For developing and launching your AI voice agent"}
                    {plan.name === "Pro" && "Self-serve for businesses with low call volumes"}
                    {plan.name === "Growth" && "Self-serve for businesses with higher call volumes"}
                    {plan.name === "Agency" && "White label platform for agencies and resellers"}
                    {plan.name === "Enterprise" && "For top-tier performance, scalability & support"}
                  </p>

                  {/* Price */}
                  <div className="mb-4 text-center">
                    <div className="flex items-baseline justify-center gap-2">
                      {plan.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {!plan.isCustom && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && !plan.isCustom && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Save up to {plan.discount || '17%'} annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={isLoading === plan.priceId}
                    className={`w-full h-10 font-semibold mb-6 ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : plan.isCustom
                        ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {isLoading === plan.priceId ? "Loading..." : 
                     plan.trialText ? plan.trialText : 
                     plan.isCustom ? "Contact us" : "Subscribe"}
                  </Button>

                  {/* Usage Information */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="font-medium">{plan.minutes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calls:</span>
                      <span className="font-medium">{plan.concurrentCalls}</span>
                    </div>
                    {plan.workflows && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Workflows:</span>
                        <span className="font-medium">{plan.workflows}</span>
                      </div>
                    )}
                    {plan.subaccounts && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subaccounts:</span>
                        <span className="font-medium">{plan.subaccounts}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include basic features. Upgrade or downgrade anytime.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/pricing")}
            className="border-primary text-primary hover:bg-primary/10"
          >
            View Detailed Pricing
          </Button>
        </div>
      </div>

      <SignInModal
        open={showSignIn}
        onOpenChange={setShowSignIn}
        initialTab="signup"
        onSuccess={() => {
          setShowSignIn(false);
          // You can add logic here to remember which plan they wanted to subscribe to
        }}
      />
    </section>
  );
};
