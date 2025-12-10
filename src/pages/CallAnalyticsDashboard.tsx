import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, TrendingUp, Clock, Activity, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import * as callAnalyticsAPI from "@/services/callAnalyticsAPI";
import type { AirtableCallRecord } from "@/services/callAnalyticsAPI";

const CallAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [airtableRecords, setAirtableRecords] = useState<AirtableCallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAirtableData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const response = await callAnalyticsAPI.getAirtableRecordsByEmail(user.email);
      if (response.success && Array.isArray(response.records)) {
        setAirtableRecords(response.records);
      } else {
        setAirtableRecords([]);
      }
    } catch (error: any) {
      console.error('Failed to load Airtable data:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load Airtable data",
        variant: "destructive",
      });
      setAirtableRecords([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAirtableData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAirtableData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Airtable data...</p>
        </div>
      </div>
    );
  }

  if (!airtableRecords.length) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onSignInClick={() => {}} onSignUpClick={() => {}} onBookDemoClick={() => {}} />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-7xl text-center">
            <h2 className="text-2xl font-bold mb-4">No Airtable Data</h2>
            <p className="text-muted-foreground">No records found for your email in Airtable.</p>
          </div>
        </div>
        <Footer onBookDemoClick={() => navigate('/demo')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation onSignInClick={() => {}} onSignUpClick={() => {}} onBookDemoClick={() => {}} />
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Call Analytics Dashboard</h1>
              <p className="text-muted-foreground">Showing your Airtable call analytics by email</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {/* Airtable Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Airtable Call Records</CardTitle>
              <CardDescription>Data fetched from Airtable for your email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">EMAIL</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">PHONE</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">A PRODUCT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"># QUANTITY</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">A CALLTYPE</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">A TOTAL_Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Summery</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">call_analyzed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {airtableRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">{rec.Name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec.EMAIL}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec.PHONE}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec["A PRODUCT"]}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec["# QUANTITY"]}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec["A CALLTYPE"]}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec["A TOTAL_Time"]}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec.Summery}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec.call_analyzed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer onBookDemoClick={() => navigate('/demo')} />
    </div>
  );
};

export default CallAnalyticsDashboard;
