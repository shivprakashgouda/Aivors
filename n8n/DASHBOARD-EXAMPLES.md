# 💻 n8n Dashboard Integration Examples

This file contains code examples for integrating n8n-synced data into Elite Render Engine dashboards.

## Example 1: Fetch Updated Subscription Data

Use this in `CustomerDashboard.tsx` or `BusinessDashboard.tsx` to fetch real-time subscription data after n8n updates.

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DashboardData {
  subscription: {
    plan: string;
    status: string;
    minutesPurchased: number;
    minutesRemaining: number;
    nextBillingDate: string;
  };
  analytics: {
    callsToday: number;
    callsChangePercent: number;
    aiStatus: 'Online' | 'Offline' | 'Maintenance';
    responseTime: number;
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true,
      });
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refresh: fetchDashboardData };
}
```

**Usage:**
```typescript
function CustomerDashboard() {
  const { data, loading, error, refresh } = useDashboardData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Plan: {data?.subscription.plan}</h1>
      <p>Minutes: {data?.subscription.minutesRemaining}</p>
      <button onClick={refresh}>Refresh Now</button>
    </div>
  );
}
```

---

## Example 2: Test n8n Connection

Test function to verify n8n backend integration from browser console or settings page.

```typescript
export async function testN8NConnection() {
  try {
    const response = await fetch(`${API_URL}/api/n8n/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testData: {
          message: 'Frontend test',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ n8n test PASSED:', result);
      alert('✅ n8n integration working!');
      return true;
    }
  } catch (error) {
    console.error('❌ n8n test FAILED:', error);
    alert('❌ Cannot connect to n8n backend');
    return false;
  }
}
```

**Usage:** Call from browser console:
```javascript
testN8NConnection();
```

---

## Example 3: React Query Integration

Use React Query for efficient data fetching with caching.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true,
      });
      return response.data;
    },
    refetchInterval: 10000, // Auto-refetch every 10s
    staleTime: 5000,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/api/n8n/manual-sync`,
        {},
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

**Usage:**
```typescript
function Dashboard() {
  const { data, isLoading } = useDashboardQuery();
  const refresh = useRefreshDashboard();

  return (
    <div>
      <h1>{data?.subscription.plan}</h1>
      <Button onClick={() => refresh.mutate()}>Sync Now</Button>
    </div>
  );
}
```

---

## Example 4: Toast Notifications on Update

Show notifications when n8n updates subscription.

```typescript
import { useToast } from '@/hooks/use-toast';

export function useN8NUpdateNotifications() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/dashboard/last-update`, {
          withCredentials: true,
        });

        const newUpdate = response.data.lastUpdated;

        if (lastUpdate && newUpdate !== lastUpdate) {
          toast({
            title: '✅ Subscription Updated',
            description: 'Synced with Stripe via n8n',
          });
        }

        setLastUpdate(newUpdate);
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    const interval = setInterval(checkUpdates, 15000);
    checkUpdates();
    return () => clearInterval(interval);
  }, [lastUpdate, toast]);
}
```

**Usage:**
```typescript
function CustomerDashboard() {
  useN8NUpdateNotifications(); // Auto-shows toast
  // ... rest of component
}
```

---

## Example 5: Manual Sync Trigger

Trigger manual sync with Stripe via n8n (for "Sync Now" button).

```typescript
export async function triggerManualSync(customerId: string) {
  try {
    const response = await axios.post(
      `${API_URL}/api/n8n/manual-sync`,
      { customerId },
      { withCredentials: true }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error('Sync failed');
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    throw error;
  }
}
```

**Usage:**
```typescript
<Button onClick={() => triggerManualSync(user.stripeCustomerId)}>
  Sync with Stripe
</Button>
```

---

## Example 6: Health Status Component

Display n8n connection health status.

```typescript
export function useN8NHealth() {
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/n8n/health`)
      .then(r => r.json())
      .then(data => setIsHealthy(data.success && data.status === 'healthy'))
      .catch(() => setIsHealthy(false));
  }, []);

  return isHealthy;
}
```

**Usage:**
```typescript
function StatusBadge() {
  const isHealthy = useN8NHealth();
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
      <span>n8n: {isHealthy ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
```

---

## Example 7: Error Handling Utility

Centralized error handling for n8n API calls.

```typescript
export function handleN8NError(error: any, context: string) {
  console.error(`❌ n8n Error [${context}]:`, error);

  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 401) return 'Authentication failed';
    if (status === 404) return 'User not found';
    if (status === 500) return 'Server error';
    
    return data?.error || 'Unexpected error';
  } else if (error.request) {
    return 'Cannot connect to server';
  } else {
    return error.message || 'Unexpected error';
  }
}
```

**Usage:**
```typescript
try {
  await fetchData();
} catch (error) {
  const message = handleN8NError(error, 'Dashboard');
  toast({ title: 'Error', description: message });
}
```

---

## Example 8: Configuration Object

Centralized configuration for all n8n endpoints.

```typescript
export const n8nConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  endpoints: {
    health: '/api/n8n/health',
    test: '/api/n8n/test',
    subscriptionUpdate: '/api/n8n/subscription/update',
    analyticsUpdate: '/api/n8n/analytics/update',
  },
  
  polling: {
    dashboard: 10000,      // 10 seconds
    analytics: 5000,       // 5 seconds  
    health: 60000,         // 60 seconds
  },
};
```

---

## Example 9: Admin Monitoring Hook

For admin dashboard to monitor n8n health.

```typescript
interface N8NHealthData {
  status: 'healthy' | 'degraded' | 'down';
  lastWebhookReceived: string | null;
  totalWebhooksProcessed: number;
  failedWebhooks: number;
}

export function useN8NMonitoring() {
  const [health, setHealth] = useState<N8NHealthData | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/n8n-health`, {
          withCredentials: true,
        });
        setHealth(response.data);
      } catch (error) {
        setHealth({
          status: 'down',
          lastWebhookReceived: null,
          totalWebhooksProcessed: 0,
          failedWebhooks: 0,
        });
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return health;
}
```

---

## Testing from Browser Console

Quick tests you can run in browser DevTools console:

```javascript
// Test n8n connection
fetch('http://localhost:3001/api/n8n/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testData: { test: true } })
}).then(r => r.json()).then(console.log);

// Check n8n health
fetch('http://localhost:3001/api/n8n/health')
  .then(r => r.json())
  .then(console.log);

// Fetch dashboard data
fetch('http://localhost:3001/api/dashboard', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

---

## Environment Variables Needed

Add to `.env` in project root:

```env
VITE_API_URL=http://localhost:3001
VITE_N8N_ENABLED=true
```

---

## Next Steps

1. Copy relevant hooks into your dashboard components
2. Import and use in `CustomerDashboard.tsx` and `BusinessDashboard.tsx`
3. Test with manual Stripe subscription creation
4. Monitor n8n execution logs for webhook processing
5. Set up toast notifications for user feedback

---

**Last Updated**: November 1, 2025
