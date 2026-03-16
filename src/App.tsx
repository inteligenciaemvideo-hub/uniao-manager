import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useProfile, useUserRole } from "@/hooks/useAuth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import PlayerDetail from "./pages/PlayerDetail";
import Financial from "./pages/Financial";
import Attendance from "./pages/Attendance";
import EventAttendance from "./pages/EventAttendance";
import EventDetail from "./pages/EventDetail";
import Stats from "./pages/Stats";
import Sponsors from "./pages/Sponsors";
import AddPlayer from "./pages/AddPlayer";
import AddEvent from "./pages/AddEvent";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: role, isLoading: roleLoading } = useUserRole(user?.id);

  if (authLoading || (user && (profileLoading || roleLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = role === "admin";

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/elenco" element={<Squad />} />
        <Route path="/jogador/:id" element={<PlayerDetail />} />
        <Route path="/financeiro" element={<Financial />} />
        <Route path="/compromissos" element={<Attendance />} />
        <Route path="/compromissos/:id" element={<EventAttendance />} />
        <Route path="/evento/:id" element={<EventDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/patrocinios" element={<Sponsors />} />
        <Route path="/novo-atleta" element={<AddPlayer />} />
        <Route path="/novo-evento" element={<AddEvent />} />
        {isAdmin && <Route path="/admin/usuarios" element={<AdminUsers />} />}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
