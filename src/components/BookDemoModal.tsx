import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Clock, User, Zap, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { demoAPI } from "@/services/api";
import { OTPInput } from "./OTPInput";

interface BookDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookDemoModal = ({ open, onOpenChange }: BookDemoModalProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    businessName: "",
    timeSlot: "",
    additionalInfo: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await demoAPI.bookDemo(formData);
      
      if (response.requiresVerification) {
        toast.success("Verification code sent!", {
          description: "Please check your email for the 6-digit code.",
        });
        setShowOTPScreen(true);
        setCountdown(60);
        setCanResend(false);
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit demo request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      await demoAPI.verifyOTP(formData.email, otp);
      
      toast.success("Email verified!", {
        description: "Your demo request has been submitted successfully.",
      });
      
      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        businessName: "",
        timeSlot: "",
        additionalInfo: "",
      });
      setShowOTPScreen(false);
      setOtp("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await demoAPI.resendOTP(formData.email);
      toast.success("New code sent to your email");
      setCountdown(60);
      setCanResend(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setShowOTPScreen(false);
    setOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {showOTPScreen ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Verify Your Email</DialogTitle>
              <p className="text-center text-muted-foreground">
                We've sent a 6-digit code to <strong>{formData.email}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="space-y-4">
                <Label className="text-foreground text-center block">Enter Verification Code</Label>
                <OTPInput value={otp} onChange={setOtp} onComplete={handleVerifyOTP} />
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
              >
                {isLoading ? "Verifying..." : "Verify & Submit Demo Request"}
              </Button>

              <div className="text-center space-y-2">
                {!canResend ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in {countdown}s
                  </p>
                ) : (
                  <Button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    variant="ghost"
                    className="text-primary hover:text-primary/90"
                  >
                    Resend Code
                  </Button>
                )}

                <Button
                  onClick={handleBackToForm}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Form
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Book Your AI Demo Call</DialogTitle>
              <p className="text-center text-muted-foreground">Discover how our AI phone manager can boost your business revenue</p>
            </DialogHeader>
            
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@business.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-foreground">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="bg-background border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot" className="text-foreground">Preferred Time Slot</Label>
                  <Select value={formData.timeSlot} onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                      <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo" className="text-foreground">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Tell us about your business current challenges..."
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    className="bg-background border-border focus:border-primary min-h-24"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
                >
                  {isLoading ? "Submitting..." : "Book My Demo"}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">30-Minute Demo</h3>
                      <p className="text-muted-foreground">Our AI specialist will show you exactly how our phone manager works with your business</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">Personal Setup</h3>
                      <p className="text-muted-foreground">We'll configure your AI with your menu, hours, and POS system during the call</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">Go Live Same Day</h3>
                      <p className="text-muted-foreground">Start taking orders through AI within hours of your demo call</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
