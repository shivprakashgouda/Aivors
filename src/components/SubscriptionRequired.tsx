import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Lock, Sparkles, TrendingUp, Phone } from "lucide-react";

export default function SubscriptionRequired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-md border-white/10 p-8 md:p-12">
        <div className="text-center space-y-6">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(333,100%,54%)] to-[hsl(271,70%,65%)] rounded-full blur-2xl opacity-50" />
              <div className="relative bg-gradient-to-r from-[hsl(333,100%,54%)] to-[hsl(271,70%,65%)] p-6 rounded-full">
                <Lock className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Subscription Required
            </h1>
            <p className="text-lg text-gray-400">
              Unlock your AI-powered business dashboard with a paid plan
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-4 py-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <Phone className="w-8 h-8 text-[hsl(333,100%,54%)] mb-2" />
              <h3 className="text-white font-semibold mb-1">AI Phone Manager</h3>
              <p className="text-sm text-gray-400">24/7 automated call handling</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <TrendingUp className="w-8 h-8 text-[hsl(271,70%,65%)] mb-2" />
              <h3 className="text-white font-semibold mb-1">Real-Time Analytics</h3>
              <p className="text-sm text-gray-400">Track calls, orders & more</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <Sparkles className="w-8 h-8 text-[hsl(333,100%,54%)] mb-2" />
              <h3 className="text-white font-semibold mb-1">Multi-Business</h3>
              <p className="text-sm text-gray-400">Manage multiple locations</p>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-gradient-to-r from-[hsl(333,100%,54%)]/10 to-[hsl(271,70%,65%)]/10 border border-[hsl(333,100%,54%)]/20 rounded-lg p-6">
            <p className="text-white/90 mb-4">
              Choose a plan to start managing your business with AI
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-white">
                  <span className="text-[hsl(333,100%,54%)]">Pro</span> - ₹999/mo
                </div>
                <div className="text-sm text-gray-400">1,000 credits/month</div>
              </div>
              <div className="hidden sm:block w-px bg-white/20" />
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-white">
                  <span className="text-[hsl(271,70%,65%)]">Enterprise</span> - ₹1,999/mo
                </div>
                <div className="text-sm text-gray-400">Unlimited credits</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[hsl(333,100%,54%)] to-[hsl(271,70%,65%)] hover:opacity-90 text-white px-8"
              onClick={() => navigate("/pricing")}
            >
              View Pricing Plans
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-gray-500 pt-4">
            Already subscribed?{" "}
            <button
              onClick={() => navigate("/dashboard")}
              className="text-[hsl(333,100%,54%)] hover:underline"
            >
              Check your subscription status
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
