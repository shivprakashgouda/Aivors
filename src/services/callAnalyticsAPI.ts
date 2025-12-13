// ============================================
// AIRTABLE APIs
// ============================================

/**
 * Get Airtable records for a user by email
 */
export const getAirtableRecordsByEmail = async (email: string) => {
  const response = await apiClient.get(`/api/airtable/by-email/${encodeURIComponent(email)}`);
  return response.data;
};

/**
 * Get all Airtable records for a user by email (with pagination support)
 */
export const getAllAirtableRecordsByEmail = async (email: string) => {
  const response = await apiClient.get(`/api/airtable/by-email/${encodeURIComponent(email)}?all=true`);
  return response.data;
};


// Airtable record type for dashboard
// Airtable API returns: { id: "recXXX", fields: { Name: "...", EMAIL: "...", ... }, createdTime: "..." }
export interface AirtableCallRecord {
  id: string;
  fields: {
    Name?: string;
    EMAIL?: string;
    PHONE?: string;
    QUANTITY?: string | number;
    CallType?: string;
    total_time?: string | number;
    Summary?: string;
    call_analyzed?: string;
    [key: string]: any;
  };
  createdTime?: string;
}
/**
 * Call Analytics API Service
 * Handles API calls for call analytics and subscription management
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// CALL ANALYTICS APIs
// ============================================

/**
 * Get dashboard statistics for a user
 */
export const getDashboardStats = async (userId: string) => {
  const response = await apiClient.get(`/api/dashboard/stats?userId=${userId}`);
  return response.data;
};

/**
 * Get recent activity for a user
 */
export const getRecentActivity = async (userId: string, limit = 20) => {
  const response = await apiClient.get(`/api/dashboard/recent-activity/${userId}?limit=${limit}`);
  return response.data;
};

/**
 * Get analytics data for charts
 */
export const getAnalytics = async (userId: string, period = 'week') => {
  const response = await apiClient.get(`/api/dashboard/analytics/${userId}?period=${period}`);
  return response.data;
};

/**
 * Get all calls for a user
 */
export const getUserCalls = async (userId: string, limit = 50, skip = 0) => {
  const response = await apiClient.get(`/api/calls/user/${userId}?limit=${limit}&skip=${skip}`);
  return response.data;
};

/**
 * Get a specific call by ID
 */
export const getCallById = async (callId: string) => {
  const response = await apiClient.get(`/api/calls/${callId}`);
  return response.data;
};

/**
 * Get call statistics for a user
 */
export const getCallStats = async (userId: string) => {
  const response = await apiClient.get(`/api/calls/stats/${userId}`);
  return response.data;
};

// ============================================
// SUBSCRIPTION APIs
// ============================================

/**
 * Get subscription details for a user
 */
export const getSubscription = async (userId: string) => {
  const response = await apiClient.get(`/api/subscription/${userId}`);
  return response.data;
};

/**
 * Add credits to a user's subscription
 */
export const addCredits = async (userId: string, minutes: number) => {
  const response = await apiClient.post('/api/subscription/add-credits', {
    userId,
    minutes,
  });
  return response.data;
};

// ============================================
// TYPES
// ============================================

export interface CallAnalytics {
  totalCalls: number;
  callsToday: number;
  callsYesterday: number;
  callsChangePercent: number;
  totalMinutesUsed: number;
  totalSecondsUsed: number;
  averageDuration: number;
}

export interface SubscriptionData {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  planName: string;
  planType: string;
  status: string;
  renewalDate?: string;
  lowBalance: boolean;
  stopWorkflow: boolean;
  creditsRemaining: number;
}

export interface CallRecord {
  callId: string;
  phoneNumber: string;
  durationMinutes: number;
  transcriptPreview: string;
  summaryPreview: string;
  transcript?: string; // Full transcript when expanded
  summary?: string; // Full summary
  createdAt: string;
  status: string;
  timeAgo: string;
}

export interface DashboardStatsData {
  user?: {
    userId: string;
    name: string;
    email: string;
    status: string;
  };
  callAnalytics: CallAnalytics;
  subscription: SubscriptionData;
  recentCalls: CallRecord[];
  alerts: {
    lowBalance: boolean;
    noCredits: boolean;
    message: string | null;
  };
}

export const callAnalyticsAPI = {
  getDashboardStats,
  getRecentActivity,
  getAnalytics,
  getUserCalls,
  getCallById,
  getCallStats,
  getSubscription,
  addCredits,
};

export default callAnalyticsAPI;
