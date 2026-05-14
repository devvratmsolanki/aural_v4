import { Component, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AppShell } from "@/components/layout/AppShell";
import { Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Liked from "./pages/Liked";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSongs from "./pages/admin/AdminSongs";
import AdminTags from "./pages/admin/AdminTags";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound.tsx";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background text-foreground gap-4 p-8">
        <div className="text-4xl">💔</div>
        <div className="text-lg font-semibold">Something went wrong</div>
        <div className="text-sm text-muted-foreground text-center max-w-sm">{(this.state.error as Error).message}</div>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:bg-primary/80 transition-colors">Reload</button>
      </div>
    );
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground text-sm">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlayerProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<RequireAuth><AppShell /></RequireAuth>}>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="songs" element={<AdminSongs />} />
                <Route path="tags" element={<AdminTags />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

  </ErrorBoundary>
);

export default App;
