import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import Auth from "./pages/Auth";
import BusinessSelector from "./pages/BusinessSelector";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Purchases from "./pages/Purchases";
import CreatePurchase from "./pages/CreatePurchase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <BusinessProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/businesses" element={<ProtectedRoute><BusinessSelector /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
                <Route path="/purchases/create" element={<ProtectedRoute><CreatePurchase /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BusinessProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
