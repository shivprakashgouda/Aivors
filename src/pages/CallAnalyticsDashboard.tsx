import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Clock, Activity, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Backend returns: { success: true, data: { records: [...], offset: null, email: '...' } }
      if (response.success && response.data && Array.isArray(response.data.records)) {
        setAirtableRecords(response.data.records);
      } else {
        setAirtableRecords([]);
      }
    } catch (error: any) {
      console.error('Failed to load call analytics:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load call analytics",
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
        </div>
      </div>
    );
  }

  if (!airtableRecords.length) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onSignInClick={() => { }} onSignUpClick={() => { }} onBookDemoClick={() => { }} />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-7xl text-center">
            <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Call Data Available</h2>
            <p className="text-muted-foreground mb-6">Your AI call analytics will appear here once you receive calls.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer onBookDemoClick={() => navigate('/demo')} />
      </div>
    );
  }

  // Calculate total time across all calls
  const totalMinutes = airtableRecords.reduce((sum, record) => {
    const timeStr = record.fields.total_time || '0';
    const minutes = parseFloat(timeStr) || 0;
    return sum + minutes;
  }, 0);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onSignInClick={() => { }} onSignUpClick={() => { }} onBookDemoClick={() => { }} />
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Call Analytics</h1>
              <p className="text-muted-foreground">AI-powered call insights and transcripts</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchAirtableData} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Total Calls Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-primary">{airtableRecords.length}</div>
                <p className="text-sm text-muted-foreground mt-2">AI-processed conversations</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Call Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-blue-500">{formatTime(totalMinutes)}</div>
                <p className="text-sm text-muted-foreground mt-2">Accumulated conversation time</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent AI Activity - Call Transcripts */}
          <Card className="border-border bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="w-6 h-6 text-primary" />
                Recent AI Activity
              </CardTitle>
              <CardDescription>
                Detailed call transcripts and analysis from your AI phone manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {airtableRecords.map((record, index) => {
                  const transcript = record.fields.call_analyzed || 'No transcript available';
                  const totalTime = record.fields.total_time || '0';
                  const callType = record.fields.CallType || 'Unknown';
                  const phoneNumber = record.fields.PHONE || 'N/A';
                  
                  // Split transcript into lines (assuming it's formatted with line breaks)
                  const transcriptLines = transcript.split('\n').filter(line => line.trim());
                  
                  return (
                    <Card 
                      key={record.id} 
                      className="border-l-4 border-l-primary bg-muted/30 hover:bg-muted/50 transition-all"
                    >
                      <CardContent className="p-6">
                        {/* Call Header */}
                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="font-mono">
                                Call #{airtableRecords.length - index}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {callType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {phoneNumber}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {totalTime} minutes
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Transcript Content */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-sm text-primary">Call Transcript</h4>
                          </div>
                          
                          {transcriptLines.length > 0 ? (
                            <div className="bg-background/50 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                              {transcriptLines.map((line, lineIndex) => (
                                <p 
                                  key={lineIndex} 
                                  className="text-sm leading-relaxed text-foreground/90 border-l-2 border-muted pl-3 py-1"
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-background/50 rounded-lg p-4">
                              <p className="text-sm text-muted-foreground italic">
                                {transcript}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
