import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { GHLoaderPage } from "@/components/GHLoader";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { isNativePlatform } from "@/lib/capacitor-autostart";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const Playlists = lazy(() => import("./pages/Playlists"));
const Screens = lazy(() => import("./pages/Screens"));
const Display = lazy(() => import("./pages/Display"));
const Player = lazy(() => import("./pages/Player"));
const Analytics = lazy(() => import("./pages/Analytics"));
const InstallGuide = lazy(() => import("./pages/InstallGuide"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Subscription = lazy(() => import("./pages/Subscription"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Studio = lazy(() => import("./pages/Studio"));
const StudioPreview = lazy(() => import("./pages/StudioPreview"));
const Download = lazy(() => import("./pages/Download"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function shouldLaunchPlayerOnBoot() {
  if (typeof window === "undefined") return false;

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isNativePlatform() || isStandalone;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <GHLoaderPage />;
  if (!user) return <Navigate to="/home" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) return <GHLoaderPage />;
  if (!user && shouldLaunchPlayerOnBoot()) return <Navigate to="/player" replace />;
  if (!user) return <Navigate to="/home" replace />;

  return <DashboardLayout><Dashboard /></DashboardLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<GHLoaderPage />}>
            <Routes>
              <Route path="/home" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/display/:screenId" element={<Display />} />
              <Route path="/player" element={<Player />} />
              <Route path="/player/:pairingCode" element={<Player />} />
              <Route path="/" element={<RootRoute />} />
              <Route path="/media" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
              <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
              <Route path="/screens" element={<ProtectedRoute><Screens /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/canvas" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
              <Route path="/studio/preview/:layoutId" element={<StudioPreview />} />
              <Route path="/install" element={<ProtectedRoute><InstallGuide /></ProtectedRoute>} />
              <Route path="/install-app" element={<InstallApp />} />
              <Route path="/download" element={<Download />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
