import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Clock } from "lucide-react";
import { useEvent, usePlayers, useEventAttendance, useSaveAttendance } from "@/hooks/useSupabase";
import { absenceReasons, AbsenceReason } from "@/lib/mockData";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type AttendanceStatus = "presente" | "falta_justificada" | "falta";

const EventAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event } = useEvent(id);
  const { data: players = [] } = usePlayers();
  const { data: attendanceData = [] } = useEventAttendance(id);
  const saveAttendance = useSaveAttendance();

  const activePlayers = players.filter(p => p.status === "Ativo");

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [reasons, setReasons] = useState<Record<string, AbsenceReason>>({});

  useEffect(() => {
    if (attendanceData.length > 0) {
      const att: Record<string, AttendanceStatus> = {};
      const reas: Record<string, AbsenceReason> = {};
      attendanceData.forEach(a => {
        att[a.player_id] = a.status as AttendanceStatus;
        if (a.absence_reason) reas[a.player_id] = a.absence_reason as AbsenceReason;
      });
      setAttendance(att);
      setReasons(reas);
    }
  }, [attendanceData]);

  if (!event) {
    return <div className="px-4 py-10 text-center text-muted-foreground">Evento não encontrado</div>;
  }

  const toggleStatus = (playerId: string) => {
    const current = attendance[playerId];
    const next: AttendanceStatus =
      !current ? "presente" :
      current === "presente" ? "falta_justificada" :
      current === "falta_justificada" ? "falta" : "presente";
    setAttendance({ ...attendance, [playerId]: next });
    if (next === "presente") {
      const newReasons = { ...reasons };
      delete newReasons[playerId];
      setReasons(newReasons);
    }
  };

  const setReason = (playerId: string, reason: AbsenceReason) => {
    setReasons({ ...reasons, [playerId]: reason });
  };

  const handleSave = async () => {
    const records = Object.entries(attendance).map(([player_id, status]) => ({
      player_id,
      status,
      absence_reason: reasons[player_id] || null,
    }));

    try {
      await saveAttendance.mutateAsync({ eventId: event.id, records });
      toast.success("Presenças salvas!");
      navigate(-1);
    } catch {
      toast.error("Erro ao salvar presenças");
    }
  };

  const statusStyles: Record<AttendanceStatus, { bg: string; icon: React.ReactNode }> = {
    presente: { bg: "bg-success/20 border-success/40", icon: <Check size={16} className="text-success" /> },
    falta_justificada: { bg: "bg-warning/20 border-warning/40", icon: <Clock size={16} className="text-warning" /> },
    falta: { bg: "bg-destructive/20 border-destructive/40", icon: <X size={16} className="text-destructive" /> },
  };

  return (
    <div className="animate-fade-in">
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold">Chamada</h2>
          <p className="text-xs text-muted-foreground">{event.type} · {new Date(event.date).toLocaleDateString("pt-BR")} · {event.time}</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Toque para alternar: <span className="text-success">Presente</span> → <span className="text-warning">Justificada</span> → <span className="text-destructive">Falta</span>
        </p>
      </div>

      <div className="px-4 space-y-2 pb-24">
        {activePlayers.map(player => {
          const status = attendance[player.id];
          const style = status ? statusStyles[status] : { bg: "bg-muted", icon: null };
          const isAbsent = status === "falta" || status === "falta_justificada";

          return (
            <div key={player.id} className="space-y-1">
              <button onClick={() => toggleStatus(player.id)} className={`card-elevated w-full flex items-center justify-between border ${style.bg} transition-colors`}>
                <div className="flex items-center gap-3">
                  <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="md" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  {style.icon || <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />}
                </div>
              </button>
              {isAbsent && (
                <div className="ml-12 mr-2">
                  <Select value={reasons[player.id] || ""} onValueChange={(val) => setReason(player.id, val as AbsenceReason)}>
                    <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border"><SelectValue placeholder="Motivo da falta..." /></SelectTrigger>
                    <SelectContent>
                      {absenceReasons.map(reason => (
                        <SelectItem key={reason} value={reason} className="text-xs capitalize">{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <button onClick={handleSave} disabled={saveAttendance.isPending} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {saveAttendance.isPending ? "Salvando..." : "Salvar Presenças"}
        </button>
      </div>
    </div>
  );
};

export default EventAttendance;
