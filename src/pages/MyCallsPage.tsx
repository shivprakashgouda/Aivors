import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Call {
  _id: string;
  callId: string;
  phoneNumber: string;
  summary: string;
  transcript: string;
  durationSeconds: number;
  createdAt: string;
  eventType: string;
}

const MyCallsPage = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/my-calls`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }

      const data = await response.json();
      if (data.success) {
        setCalls(data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load calls',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/pricing');
      return;
    }
    fetchCalls();
  }, [isAuthenticated, navigate]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onSignInClick={() => {}} 
        onSignUpClick={() => {}} 
        onBookDemoClick={() => {}} 
      />
      
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Calls</h1>
              <p className="text-muted-foreground">
                View all your call records and transcripts
              </p>
            </div>
            <Button onClick={fetchCalls} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calls.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(calls.reduce((sum, call) => sum + call.durationSeconds, 0))}
                </div>
                <p className="text-xs text-muted-foreground">Combined call time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calls.filter(c => {
                    const callDate = new Date(c.createdAt);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return callDate > dayAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Calls Table */}
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                {user?.email ? `Showing calls for ${user.email}` : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading calls...</span>
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Calls Yet</h3>
                  <p className="text-muted-foreground">
                    Your call records will appear here once you receive calls
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call Date</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call._id}>
                          <TableCell className="font-medium">
                            {formatDate(call.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {call.phoneNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatDuration(call.durationSeconds)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {call.summary || 'No summary available'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCall(call)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Details Modal */}
          {selectedCall && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedCall(null)}
            >
              <Card 
                className="max-w-3xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader>
                  <CardTitle>Call Details</CardTitle>
                  <CardDescription>
                    {formatDate(selectedCall.createdAt)} • {selectedCall.phoneNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Duration</h3>
                    <Badge>{formatDuration(selectedCall.durationSeconds)}</Badge>
                  </div>
                  
                  {selectedCall.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-muted-foreground">{selectedCall.summary}</p>
                    </div>
                  )}
                  
                  {selectedCall.transcript && (
                    <div>
                      <h3 className="font-semibold mb-2">Transcript</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedCall.transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setSelectedCall(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      <Footer onBookDemoClick={() => {}} />
    </div>
  );
};

export default MyCallsPage;
