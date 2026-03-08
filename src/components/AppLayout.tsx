import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, DollarSign, CalendarCheck, BarChart3, Settings, LogOut, Shield } from "lucide-react";
import { useRef } from "react";
import { useTeamSettings, useUpdateTeamSettings, uploadPhoto } from "@/hooks/useSupabase";
import { useAuth, useUserRole, signOut } from "@/hooks/useAuth";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/elenco", icon: Users, label: "Elenco" },
  { path: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { path: "/compromissos", icon: CalendarCheck, label: "Compromissos" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: teamSettings } = useTeamSettings();
  const updateSettings = useUpdateTeamSettings();
  const logoRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.id);
  const isAdmin = role === "admin";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = `team/${Date.now()}-${file.name}`;
      const url = await uploadPhoto("photos", path, file);
      await updateSettings.mutateAsync({ team_logo_url: url });
    }
  };

  const teamLogo = teamSettings?.team_logo_url;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card">
        <img src="/images/distrito-uniao-logo.png" alt="Distrito União" className="w-10 h-10 object-contain" />
        <div className="flex-1">
          <h1 className="text-sm font-bold tracking-widest text-primary">DISTRITO UNIÃO</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => navigate("/admin/usuarios")} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Gerenciar usuários">
              <Shield size={18} />
            </button>
          )}
          <button onClick={() => signOut()} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
            return (
              <button key={path} onClick={() => navigate(path)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
