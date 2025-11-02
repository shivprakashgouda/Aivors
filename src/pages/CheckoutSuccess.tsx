import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { stripeAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [activating, setActivating] = useState(true);
  const [activated, setActivated] = useState(false);
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast.error('No session ID found');
        navigate('/pricing');
        return;
      }

      try {
        await stripeAPI.activateSubscription(sessionId);
        await refreshUser();
        setActivated(true);
        toast.success('Subscription activated successfully!');
      } catch (error: any) {
        console.error('Activation error:', error);
        toast.error(error.response?.data?.error || 'Failed to activate subscription');
      } finally {
        setActivating(false);
      }
    };

    activateSubscription();
  }, [searchParams, refreshUser, navigate]);

  if (activating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Activating your subscription...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we set up your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            {activated ? 'Payment Successful!' : 'Payment Processed'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {activated 
              ? `Your ${user?.subscription?.plan || 'subscription'} plan is now active`
              : 'Your payment has been processed'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activated && user && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-medium">{user.subscription.plan}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Minutes:</span>
                <span className="text-white font-medium">
                  {user.subscription.minutesRemaining} / {user.subscription.minutesPurchased}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 font-medium capitalize">
                  {user.subscription.status}
                </span>
              </div>
            </div>
          )}
          <Button
            onClick={() => navigate('/business-dashboard')}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-white/10 text-white hover:bg-white/5"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
