import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { authAPI } from '@/services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'pending_payment' | 'active' | 'inactive' | 'cancelled';
  subscription: {
    plan: string | null;
    status: string;
    minutesPurchased: number;
    minutesRemaining: number;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    startDate: Date | null;
    nextBillingDate: Date | null;
  };
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromVerification: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('🔍 Fetching current user...');
      const data = await authAPI.me();
      console.log('✅ User data received:', data.user.email);
      setUser(data.user);
    } catch (error: any) {
      console.log('❌ Failed to fetch user:', error?.response?.status, error?.response?.data?.message);
      
      // Only clear user if it's an auth error, not a network error
      if (error?.response?.status === 401) {
        console.log('ℹ️  User not authenticated (401) - clearing user state');
        setUser(null);
      } else if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        console.log('⚠️  Network error - keeping existing user state, will retry later');
        // Don't clear user on network errors - server might be temporarily down
      } else {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 Initializing authentication...');
      try {
        // Prime CSRF cookie for POST requests
        try { 
          await api.get('/api/csrf-token'); 
          console.log('✅ CSRF token obtained');
        } catch (csrfError) {
          console.warn('⚠️  CSRF token fetch failed (non-critical):', csrfError);
        }
        
        // Attempt to refresh access token if we have refresh token
        try { 
          console.log('🔄 Calling refresh endpoint to get new access token...');
          const refreshResult = await authAPI.refresh(); 
          console.log('✅ Token refresh successful:', refreshResult);
          
          // Small delay to ensure cookie is set before next request
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (refreshError: any) {
          console.log('ℹ️  Token refresh failed:', refreshError?.response?.status);
          // 401 is expected if not logged in, don't treat as error
          if (refreshError?.response?.status === 401) {
            console.log('   → No valid refresh token (user not logged in)');
          } else {
            console.error('⚠️  Unexpected refresh error:', refreshError?.message);
          }
        }
        
        // Try to get current user (will use the refreshed access token)
        await refreshUser();
        console.log('✅ Auth initialization complete');
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login({ email, password });
    setUser(data.user);
  };

  const setUserFromVerification = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshUser,
    setUserFromVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
