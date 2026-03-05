import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import PlayerDetail from "./pages/PlayerDetail";
import Financial from "./pages/Financial";
import Attendance from "./pages/Attendance";
import EventAttendance from "./pages/EventAttendance";
import EventDetail from "./pages/EventDetail";
import Stats from "./pages/Stats";
import AddPlayer from "./pages/AddPlayer";
import AddEvent from "./pages/AddEvent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/novo-atleta" element={<AddPlayer />} />
            <Route path="/novo-evento" element={<AddEvent />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
