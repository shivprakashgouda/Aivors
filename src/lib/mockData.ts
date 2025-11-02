// Mock user data and utilities for Elite Render Engine

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  credits: number;
  maxCredits: number;
  renewalDate: string;
  status: "active" | "cancelled" | "past_due";
  createdAt: string;
}

export const PLAN_CREDITS = {
  Free: 10,
  Pro: 500,
  Enterprise: 2000,
};

export const PLAN_PRICES = {
  Free: 0,
  Pro: 999,
  Enterprise: 1999,
};

// Generate mock users
export const generateMockUsers = (count: number = 10): User[] => {
  const names = [
    "Tanmay Bari",
    "Rahul Sharma",
    "Priya Patel",
    "Amit Kumar",
    "Sneha Reddy",
    "Vikram Singh",
    "Ananya Gupta",
    "Rohan Mehta",
    "Kavya Nair",
    "Arjun Desai",
  ];

  const plans: ("Free" | "Pro" | "Enterprise")[] = ["Free", "Pro", "Enterprise"];
  const statuses: ("active" | "cancelled" | "past_due")[] = ["active", "cancelled", "past_due"];

  return Array.from({ length: count }, (_, i) => {
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const maxCredits = PLAN_CREDITS[plan];
    const credits = Math.floor(Math.random() * maxCredits);
    const status = statuses[Math.floor(Math.random() * 10)] || "active"; // 70% active

    return {
      id: `user_${i + 1}`,
      name: names[i] || `User ${i + 1}`,
      email: names[i]?.toLowerCase().replace(" ", ".") + "@restaurant.com" || `user${i + 1}@restaurant.com`,
      plan,
      credits,
      maxCredits,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: status === "active" ? "active" : status,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    };
  });
};

// LocalStorage helpers
export const StorageKeys = {
  USER_DATA: "userData",
  AUTH_TOKEN: "authToken",
  IS_ADMIN: "isAdmin",
} as const;

export const storage = {
  // Get item from localStorage
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },

  // Set item in localStorage
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  },

  // Remove item from localStorage
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  // Clear all items
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

// User management utilities
export const userUtils = {
  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    return storage.get<User>(StorageKeys.USER_DATA);
  },

  // Save user to localStorage
  saveUser: (user: User): void => {
    storage.set(StorageKeys.USER_DATA, user);
  },

  // Update user credits
  updateCredits: (creditsToAdd: number): User | null => {
    const user = userUtils.getCurrentUser();
    if (!user) return null;

    const updatedUser = {
      ...user,
      credits: Math.min(user.credits + creditsToAdd, user.maxCredits),
    };

    userUtils.saveUser(updatedUser);
    return updatedUser;
  },

  // Update user plan
  updatePlan: (newPlan: "Free" | "Pro" | "Enterprise"): User | null => {
    const user = userUtils.getCurrentUser();
    if (!user) return null;

    const updatedUser = {
      ...user,
      plan: newPlan,
      maxCredits: PLAN_CREDITS[newPlan],
      credits: Math.min(user.credits, PLAN_CREDITS[newPlan]),
    };

    userUtils.saveUser(updatedUser);
    return updatedUser;
  },

  // Use credits
  useCredits: (amount: number): boolean => {
    const user = userUtils.getCurrentUser();
    if (!user || user.credits < amount) return false;

    const updatedUser = {
      ...user,
      credits: user.credits - amount,
    };

    userUtils.saveUser(updatedUser);
    return true;
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return storage.get<boolean>(StorageKeys.IS_ADMIN) || false;
  },

  // Logout user
  logout: (): void => {
    storage.remove(StorageKeys.USER_DATA);
    storage.remove(StorageKeys.AUTH_TOKEN);
  },
};

// Date utilities
export const dateUtils = {
  // Format date to readable string
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  },

  // Get days until renewal
  daysUntilRenewal: (renewalDate: string): number => {
    const now = new Date();
    const renewal = new Date(renewalDate);
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // Get next renewal date (30 days from now)
  getNextRenewalDate: (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  },
};

// Credit utilities
export const creditUtils = {
  // Calculate credit usage percentage
  getUsagePercentage: (used: number, total: number): number => {
    return Math.round((used / total) * 100);
  },

  // Get remaining percentage
  getRemainingPercentage: (remaining: number, total: number): number => {
    return Math.round((remaining / total) * 100);
  },

  // Format credits display
  formatCredits: (credits: number): string => {
    return credits.toLocaleString();
  },
};

// Subscription utilities
export const subscriptionUtils = {
  // Calculate monthly revenue from users
  calculateRevenue: (users: User[]): number => {
    return users.reduce((total, user) => {
      return total + PLAN_PRICES[user.plan];
    }, 0);
  },

  // Get subscription stats
  getStats: (users: User[]) => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      cancelled: users.filter((u) => u.status === "cancelled").length,
      pastDue: users.filter((u) => u.status === "past_due").length,
      free: users.filter((u) => u.plan === "Free").length,
      pro: users.filter((u) => u.plan === "Pro").length,
      enterprise: users.filter((u) => u.plan === "Enterprise").length,
      revenue: subscriptionUtils.calculateRevenue(users),
    };
  },
};

// Initialize mock user if none exists
export const initializeMockUser = (): User => {
  const existingUser = userUtils.getCurrentUser();
  if (existingUser) return existingUser;

  const mockUser: User = {
    id: "user_demo",
    name: "Tanmay Bari",
    email: "tanmay@restaurant.com",
    plan: "Pro",
    credits: 342,
    maxCredits: 500,
    renewalDate: dateUtils.getNextRenewalDate(),
    status: "active",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };

  userUtils.saveUser(mockUser);
  return mockUser;
};
