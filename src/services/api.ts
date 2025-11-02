import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('🌐 API Configuration:', {
  baseURL: API_BASE_URL,
  env: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL,
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
  timeout: 30000, // 30 second timeout
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error) => {
    console.error('🔴 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('🔴 API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      isNetworkError: error.message === 'Network Error',
      isCORS: error.message.includes('CORS'),
    });
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  verifyOTP: async (data: { email: string; otp: string }) => {
    const response = await api.post('/api/auth/verify-otp', data);
    return response.data;
  },

  resendOTP: async (data: { email: string }) => {
    const response = await api.post('/api/auth/resend-otp', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/admin/login', data);
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  updateSubscription: async (userId: string, data: any) => {
    const response = await api.put(`/api/admin/users/${userId}/subscription`, data);
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const response = await api.put(`/api/admin/users/${userId}/status`, { status });
    return response.data;
  },

  getAuditLogs: async (params?: { page?: number; limit?: number; eventType?: string; userId?: string }) => {
    const response = await api.get('/api/admin/audit-logs', { params });
    return response.data;
  },
};

// Stripe API
export const stripeAPI = {
  createCheckoutSession: async (data: { priceId: string; planName: string; credits?: number }) => {
    const response = await api.post('/api/create-checkout-session', data);
    return response.data;
  },

  activateSubscription: async (sessionId: string) => {
    const response = await api.post('/api/activate-subscription', { sessionId });
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/api/cancel-subscription');
    return response.data;
  },

  createPortalSession: async () => {
    const response = await api.post('/api/create-portal-session');
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  getMySubscription: async () => {
    const response = await api.get('/api/subscription/me');
    return response.data;
  },
};

// Demo API
export const demoAPI = {
  bookDemo: async (data: {
    fullName: string;
    phone: string;
    email: string;
    businessName: string;
    timeSlot?: string;
    additionalInfo?: string;
  }) => {
    const response = await apiClient.post('/api/demo/book', data);
    return response.data;
  },
  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/api/demo/verify-otp', { email, otp });
    return response.data;
  },
  resendOTP: async (email: string) => {
    const response = await apiClient.post('/api/demo/resend-otp', { email });
    return response.data;
  },
};

export default api;
