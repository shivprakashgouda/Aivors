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
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await authAPI.me();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Prime CSRF cookie for POST requests
        try { await api.get('/api/csrf-token'); } catch {}
        // Attempt to refresh access token (no-op if not logged in)
        try { await authAPI.refresh(); } catch {}
        await refreshUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
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

  const signup = async (name: string, email: string, password: string) => {
    const data = await authAPI.signup({ name, email, password });
    setUser(data.user);
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
    signup,
    logout,
    refreshUser,
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
