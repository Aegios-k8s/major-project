import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SecurityProvider } from "./contexts/SecurityContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLayout from "./components/GlobalLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SecurityLayout from "./components/security/SecurityLayout";
import K8sScorePage from "./pages/security/K8sScorePage";
import K8sPosturePage from "./pages/security/K8sPosturePage";
import K8sActionsPage from "./pages/security/K8sActionsPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SecurityProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Authentication Service Routes */}
              <Route path="/authentication/login" element={<LoginPage />} />
              <Route path="/authentication/signup" element={<SignupPage />} />
              <Route path="/authentication/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/authentication/login" replace />} />
              
              {/* Protected Routes */}
              <Route path="/fetching-service" element={
                <ProtectedRoute>
                  <GlobalLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/fetching-service/dashboard" replace />} />
                <Route path="dashboard" element={<Index />} />
                <Route path="fetch-data" element={<Index />} />
                <Route path="validation" element={<Index />} />
              </Route>
              
              {/* Security Service Routes */}
              <Route path="/security-service" element={
                <ProtectedRoute>
                  <GlobalLayout />
                </ProtectedRoute>
              }>
                <Route element={<SecurityLayout />}>
                  <Route path="k8s-score" element={<K8sScorePage />} />
                  <Route path="k8s-posture" element={<K8sPosturePage />} />
                  <Route path="k8s-action" element={<K8sActionsPage />} />
                  <Route path="k8s-action/:serviceId" element={<K8sActionsPage />} />
                </Route>
              </Route>
              
              {/* Legacy redirects */}
              <Route path="/login" element={<Navigate to="/authentication/login" replace />} />
              <Route path="/signup" element={<Navigate to="/authentication/signup" replace />} />
              <Route path="/dashboard" element={<Navigate to="/fetching-service/dashboard" replace />} />
              <Route path="/security/*" element={<Navigate to="/security-service/k8s-score" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SecurityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
