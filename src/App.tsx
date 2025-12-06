import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import CustomerDashboard from "./pages/CustomerDashboard";
import CallAnalyticsDashboard from "./pages/CallAnalyticsDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AdminLogin from "./pages/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import ForgotPasswordStandalone from "./pages/ForgotPasswordStandalone";
import ResetPasswordStandalone from "./pages/ResetPasswordStandalone";
import NotFound from "./pages/NotFound";
import { PrivateRoute, AdminRoute } from "@/components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
            <Route path="/call-analytics" element={<PrivateRoute><CallAnalyticsDashboard /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/business-dashboard" element={<PrivateRoute><BusinessDashboard /></PrivateRoute>} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPasswordStandalone />} />
            <Route path="/reset-password-standalone" element={<ResetPasswordStandalone />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
