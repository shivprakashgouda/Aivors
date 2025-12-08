import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Phone } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RetellAgentConnect = () => {
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch current agent status on mount
  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/retell/agent-status`, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.data) {
        setStatus(response.data.data);
        if (response.data.data.agentId) {
          setAgentId(response.data.data.agentId);
        }
      }
    } catch (err) {
      console.error('Error fetching agent status:', err);
    }
  };

  const handleConnect = async () => {
    if (!agentId || agentId.trim() === '') {
      setError('Please enter a valid Retell Agent ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/api/retell/connect-agent`,
        { agentId: agentId.trim() },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Retell agent connected successfully! Your calls will now appear in the dashboard.');
        setStatus({
          isConnected: true,
          agentId: agentId.trim(),
          aiStatus: 'Online'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect Retell agent');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.delete(
        `${API_URL}/api/retell/disconnect-agent`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Retell agent disconnected successfully');
        setAgentId('');
        setStatus({
          isConnected: false,
          agentId: null,
          aiStatus: 'Offline'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect Retell agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          <CardTitle>Retell AI Agent Connection</CardTitle>
        </div>
        <CardDescription>
          Connect your Retell AI agent to track calls and analytics in your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {status.isConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Agent Connected</p>
                  <p className="text-xs text-muted-foreground">Agent ID: {status.agentId}</p>
                  <p className="text-xs text-muted-foreground">Status: {status.aiStatus}</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">No Agent Connected</p>
                  <p className="text-xs text-muted-foreground">Connect your Retell agent to start tracking calls</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Agent ID Input */}
        <div className="space-y-2">
          <Label htmlFor="agentId">Retell Agent ID</Label>
          <Input
            id="agentId"
            type="text"
            placeholder="agent_xxxxxxxxxxxxx"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={loading || status?.isConnected}
          />
          <p className="text-xs text-muted-foreground">
            Find your agent ID in the Retell AI dashboard under Agents → [Your Agent] → Agent ID
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!status?.isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={loading || !agentId}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Agent
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect Agent
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900">How to connect:</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Log in to your Retell AI dashboard</li>
            <li>Navigate to the "Agents" section</li>
            <li>Select your agent and copy the Agent ID</li>
            <li>Paste the Agent ID above and click "Connect Agent"</li>
            <li>All calls from this agent will now appear in your dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetellAgentConnect;
