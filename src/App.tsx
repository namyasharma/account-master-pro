import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import BusinessSelector from "./pages/BusinessSelector";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Purchases from "./pages/Purchases";
import CreatePurchase from "./pages/CreatePurchase";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SimpleBarcodeTest from "@/pages/SimpleBarcodeTest";
import Pricing from "@/pages/Pricing";
import PublicInvoiceView from "./pages/PublicInvoiceView";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onboardingCompleted } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onboardingCompleted } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (onboardingCompleted) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const BusinessRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <BusinessProvider>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/onboarding"
                    element={
                      <OnboardingRoute>
                        <Onboarding />
                      </OnboardingRoute>
                    }
                  />
                  <Route
                    path="/businesses"
                    element={
                      <BusinessRoute>
                        <BusinessSelector />
                      </BusinessRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/items"
                    element={
                      <ProtectedRoute>
                        <Items />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/suppliers"
                    element={
                      <ProtectedRoute>
                        <Suppliers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute>
                        <Customers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoices"
                    element={
                      <ProtectedRoute>
                        <Invoices />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoices/create"
                    element={
                      <ProtectedRoute>
                        <CreateInvoice />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/purchases"
                    element={
                      <ProtectedRoute>
                        <Purchases />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/purchases/create"
                    element={
                      <ProtectedRoute>
                        <CreatePurchase />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/barcode-test"
                    element={
                      <ProtectedRoute>
                        <SimpleBarcodeTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pricing"
                    element={
                      <ProtectedRoute>
                        <Pricing />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoice/view/:token"
                    element={<PublicInvoiceView />}
                  />
                  <Route path="/" element={<Navigate to="/auth" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BusinessProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
