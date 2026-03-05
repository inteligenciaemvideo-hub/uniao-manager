import { useNavigate } from "react-router-dom";
import { CalendarCheck, MapPin, Clock, Plus, Swords } from "lucide-react";
import { useEvents, useTeamSettings } from "@/hooks/useSupabase";

const typeColors: Record<string, string> = {
  "Treino": "bg-secondary text-muted-foreground",
  "Amistoso": "bg-primary/20 text-primary",
  "Torneio": "bg-warning/20 text-warning",
};

const Attendance = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEvents();
  const { data: teamSettings } = useTeamSettings();

  return (
    <div className="px-4 py-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Compromissos & Eventos</h2>
        <button onClick={() => navigate("/novo-evento")} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Plus size={18} />
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div
              key={event.id}
              className="card-elevated cursor-pointer hover:border-primary/20 transition-colors"
              onClick={() => navigate(`/evento/${event.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {teamSettings?.team_logo_url && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                      <img src={teamSettings.team_logo_url} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[event.type] || "bg-secondary text-muted-foreground"}`}>
                    {event.type}
                  </span>
                  {event.opponent && (
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Swords size={12} /> vs. {event.opponent}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarCheck size={12} />{new Date(event.date).toLocaleDateString("pt-BR")}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{event.time}</span>
                <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attendance;
