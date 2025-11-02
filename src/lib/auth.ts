// Authentication and User Management System
import { User } from "./mockData";

export interface AuthUser extends User {
  businesses: Business[];
  activeBusinessId: string | null;
  subscription: {
    plan: "Free" | "Pro" | "Enterprise";
    status: "active" | "inactive" | "trial" | "cancelled";
    purchaseDate: string | null;
    expiryDate: string | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

export interface Business {
  id: string;
  name: string;
  type: string;
  phoneNumber: string;
  address: string;
  setupComplete: boolean;
  setupSteps: {
    businessInfo: boolean;
    aiTraining: boolean;
    posIntegration: boolean;
    phoneSetup: boolean;
  };
  analytics: {
    callsToday: number;
    callsTrend: number;
    aiStatus: "online" | "offline" | "training";
    responseTime: string;
  };
  recentActivity: Activity[];
  createdAt: string;
}

export interface Activity {
  id: string;
  type: "order" | "reservation" | "inquiry" | "support";
  description: string;
  amount?: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

// Auth Storage Keys
const AUTH_KEYS = {
  USER: "auth_user",
  TOKEN: "auth_token",
  SESSION: "auth_session",
} as const;

// Mock session duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Generate mock activities
export const generateMockActivities = (count: number = 10): Activity[] => {
  const types: Activity["type"][] = ["order", "reservation", "inquiry", "support"];
  const orderDescriptions = [
    "2x Margherita Pizza, 1x Caesar Salad",
    "3x Chicken Tikka, 2x Naan, 1x Raita",
    "1x Burger Deluxe, 2x Fries, 3x Soft Drinks",
    "4x Sushi Rolls, 1x Miso Soup",
    "2x Pasta Carbonara, 1x Garlic Bread",
  ];
  const reservationDescriptions = [
    "Table for 4 - 7:00 PM",
    "Table for 2 - 8:30 PM",
    "Table for 6 - 6:00 PM",
    "Table for 8 - 9:00 PM",
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const timestamp = new Date(Date.now() - Math.random() * 3600000 * 24).toISOString();

    let description = "";
    let amount = undefined;

    switch (type) {
      case "order":
        description = orderDescriptions[Math.floor(Math.random() * orderDescriptions.length)];
        amount = `$${(Math.random() * 50 + 20).toFixed(2)}`;
        break;
      case "reservation":
        description = reservationDescriptions[Math.floor(Math.random() * reservationDescriptions.length)];
        break;
      case "inquiry":
        description = "Customer asked about menu items";
        break;
      case "support":
        description = "Technical issue reported";
        break;
    }

    return {
      id: `activity_${i + 1}`,
      type,
      description,
      amount,
      timestamp,
      status: Math.random() > 0.1 ? "completed" : "pending",
    };
  });
};

// Create mock business
export const createMockBusiness = (userId: string, isFirstBusiness: boolean = true): Business => {
  return {
    id: `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: isFirstBusiness ? "My Restaurant" : "Second Location",
    type: "Restaurant",
    phoneNumber: isFirstBusiness ? "+1 (555) 123-4567" : "+1 (555) 987-6543",
    address: isFirstBusiness ? "123 Main St, City, State" : "456 Oak Ave, City, State",
    setupComplete: isFirstBusiness,
    setupSteps: {
      businessInfo: isFirstBusiness,
      aiTraining: isFirstBusiness,
      posIntegration: isFirstBusiness,
      phoneSetup: isFirstBusiness,
    },
    analytics: {
      callsToday: Math.floor(Math.random() * 200) + 50,
      callsTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : -Math.floor(Math.random() * 15),
      aiStatus: "online",
      responseTime: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
    },
    recentActivity: generateMockActivities(10),
    createdAt: new Date().toISOString(),
  };
};

// Auth Service
export const authService = {
  // Sign up new user
  signUp: (email: string, password: string, name: string): AuthUser => {
    const newUser: AuthUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      plan: "Free",
      credits: 10,
      maxCredits: 10,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      businesses: [],
      activeBusinessId: null,
      subscription: {
        plan: "Free",
        status: "inactive",
        purchaseDate: null,
        expiryDate: null,
      },
    };

    // Store user
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(AUTH_KEYS.TOKEN, `token_${Date.now()}`);
    localStorage.setItem(
      AUTH_KEYS.SESSION,
      JSON.stringify({
        expiresAt: Date.now() + SESSION_DURATION,
        createdAt: Date.now(),
      })
    );

    return newUser;
  },

  // Sign in existing user
  signIn: (email: string, password: string): AuthUser | null => {
    // Check if user exists (in real app, this would be API call)
    const existingUser = localStorage.getItem(AUTH_KEYS.USER);

    if (existingUser) {
      const user: AuthUser = JSON.parse(existingUser);
      if (user.email === email) {
        // Update session
        localStorage.setItem(AUTH_KEYS.TOKEN, `token_${Date.now()}`);
        localStorage.setItem(
          AUTH_KEYS.SESSION,
          JSON.stringify({
            expiresAt: Date.now() + SESSION_DURATION,
            createdAt: Date.now(),
          })
        );
        return user;
      }
    }

    // For demo: create new user if not found
    return authService.signUp(email, password, email.split("@")[0]);
  },

  // Get current user
  getCurrentUser: (): AuthUser | null => {
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    if (!userStr) return null;

    const sessionStr = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      authService.signOut();
      return null;
    }

    return JSON.parse(userStr);
  },

  // Update user
  updateUser: (updates: Partial<AuthUser>): void => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(updatedUser));
  },

  // Sign out
  signOut: (): void => {
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.SESSION);
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    const sessionStr = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!sessionStr) return false;

    const session = JSON.parse(sessionStr);
    return Date.now() < session.expiresAt;
  },

  // Get active business
  getActiveBusiness: (): Business | null => {
    const user = authService.getCurrentUser();
    if (!user || !user.activeBusinessId) return null;

    return user.businesses.find((b) => b.id === user.activeBusinessId) || null;
  },

  // Switch business
  switchBusiness: (businessId: string): void => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const business = user.businesses.find((b) => b.id === businessId);
    if (!business) return;

    authService.updateUser({ activeBusinessId: businessId });
  },

  // Add new business
  addBusiness: (businessData: Partial<Business>): Business => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const newBusiness = createMockBusiness(user.id, false);
    const updatedBusinesses = [...user.businesses, { ...newBusiness, ...businessData }];

    authService.updateUser({
      businesses: updatedBusinesses,
      activeBusinessId: newBusiness.id,
    });

    return newBusiness;
  },

  // Update business
  updateBusiness: (businessId: string, updates: Partial<Business>): void => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const updatedBusinesses = user.businesses.map((b) =>
      b.id === businessId ? { ...b, ...updates } : b
    );

    authService.updateUser({ businesses: updatedBusinesses });
  },

  // Update business setup step
  updateSetupStep: (step: keyof Business["setupSteps"], completed: boolean): void => {
    const user = authService.getCurrentUser();
    const business = authService.getActiveBusiness();
    if (!user || !business) return;

    const updatedSteps = { ...business.setupSteps, [step]: completed };
    const allComplete = Object.values(updatedSteps).every((v) => v);

    authService.updateBusiness(business.id, {
      setupSteps: updatedSteps,
      setupComplete: allComplete,
    });
  },

  // Add activity to business
  addActivity: (activity: Omit<Activity, "id" | "timestamp">): void => {
    const user = authService.getCurrentUser();
    const business = authService.getActiveBusiness();
    if (!user || !business) return;

    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const updatedActivities = [newActivity, ...business.recentActivity].slice(0, 20);

    authService.updateBusiness(business.id, {
      recentActivity: updatedActivities,
    });
  },

  // Update analytics
  updateAnalytics: (analytics: Partial<Business["analytics"]>): void => {
    const user = authService.getCurrentUser();
    const business = authService.getActiveBusiness();
    if (!user || !business) return;

    authService.updateBusiness(business.id, {
      analytics: { ...business.analytics, ...analytics },
    });
  },

  // Check if user has active paid subscription
  hasActiveSubscription: (): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;

    const { subscription } = user;
    
    // Free plan doesn't give access to business dashboard
    if (subscription.plan === "Free") return false;
    
    // Check if subscription is active
    if (subscription.status !== "active") return false;
    
    // Check if subscription hasn't expired
    if (subscription.expiryDate) {
      const expiryDate = new Date(subscription.expiryDate);
      if (expiryDate < new Date()) {
        // Subscription expired, update status
        authService.updateUser({
          subscription: { ...subscription, status: "inactive" },
        });
        return false;
      }
    }
    
    return true;
  },

  // Activate subscription after purchase
  activateSubscription: (plan: "Pro" | "Enterprise", stripeCustomerId?: string, stripeSubscriptionId?: string): void => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

    // Create first business when subscription is activated
    const firstBusiness = createMockBusiness(user.id, true);

    authService.updateUser({
      plan,
      subscription: {
        plan,
        status: "active",
        purchaseDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        stripeCustomerId,
        stripeSubscriptionId,
      },
      businesses: [firstBusiness],
      activeBusinessId: firstBusiness.id,
    });
  },

  // Cancel subscription
  cancelSubscription: (): void => {
    const user = authService.getCurrentUser();
    if (!user) return;

    authService.updateUser({
      subscription: {
        ...user.subscription,
        status: "cancelled",
      },
    });
  },
};
