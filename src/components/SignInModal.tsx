import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/services/api";
import { toast } from "sonner";
import { OTPInput } from "@/components/OTPInput";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
  initialTab?: 'signin' | 'signup';
}

export const SignInModal = ({ open, onOpenChange, onSuccess, initialTab = 'signin' }: SignInModalProps) => {
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(signInEmail, signInPassword);
      toast.success(`Welcome back!`);
      if (onSuccess) {
        await onSuccess();
      } else {
        navigate("/dashboard");
      }
      onOpenChange(false);
    } catch (error: any) {
      // Check if email verification is required
      if (error.response?.data?.requiresVerification) {
        setVerificationEmail(signInEmail);
        setShowOTPVerification(true);
        toast.info("Please verify your email first");
      } else {
        toast.error(error.response?.data?.error || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.signup({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
      });

      if (response.requiresVerification) {
        setVerificationEmail(signUpEmail);
        setShowOTPVerification(true);
        startOTPTimer();
        toast.success("Account created! Please check your email for the verification code.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP({
        email: verificationEmail,
        otp: otp,
      });

      toast.success("Email verified successfully!");
      
      // Auto-login after verification
      if (onSuccess) {
        await onSuccess();
      } else {
        navigate("/dashboard");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP. Please try again.");
      setOtpValue("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ email: verificationEmail });
      toast.success("New OTP sent to your email");
      setOtpValue("");
      startOTPTimer();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend OTP");
    }
  };

  const startOTPTimer = () => {
    setOtpTimer(60);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBackToLogin = () => {
    setShowOTPVerification(false);
    setOtpValue("");
    setVerificationEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        {showOTPVerification ? (
          // OTP Verification Screen
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Verify Your Email</DialogTitle>
              <p className="text-center text-muted-foreground">We've sent a 6-digit code to</p>
              <p className="text-center text-primary font-medium">{verificationEmail}</p>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Mail className="h-16 w-16 text-primary opacity-50" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground text-center block">Enter OTP Code</Label>
                  <OTPInput
                    length={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    onComplete={handleVerifyOTP}
                  />
                </div>

                <Button
                  onClick={() => handleVerifyOTP(otpValue)}
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  {otpTimer > 0 ? (
                    <p className="text-sm text-primary">Resend code in {otpTimer}s</p>
                  ) : (
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Original Sign In/Sign Up Screen
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Welcome</DialogTitle>
              <p className="text-center text-muted-foreground">Access your AI Voice platform</p>
            </DialogHeader>

            <Tabs defaultValue={initialTab} className="pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">Email Address</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-foreground">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="bg-background border-border focus:border-primary"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
