import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, DollarSign, CalendarCheck, BarChart3, Camera } from "lucide-react";
import { useRef } from "react";
import { useTeamSettings, useUpdateTeamSettings, uploadPhoto } from "@/hooks/useSupabase";

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
        <div
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg overflow-hidden cursor-pointer relative group"
          onClick={() => logoRef.current?.click()}
        >
          {teamLogo ? (
            <img src={teamLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            "DU"
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera size={14} className="text-white" />
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <div>
          <h1 className="text-sm font-bold tracking-widest text-primary">DISTRITO UNIÃO</h1>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Gestão de Elenco</p>
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
