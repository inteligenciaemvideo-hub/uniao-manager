import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarCheck, Swords, Users, Check, Plus, Upload, FileDown, Ban, Image as ImageIcon } from "lucide-react";
import { useEvent, usePlayers, useEventConvocations, useSaveConvocations, useScheduledAbsences, useSaveScheduledAbsences, useTeamSettings, useUpdateEvent, uploadPhoto } from "@/hooks/useSupabase";
import PlayerAvatar from "@/components/PlayerAvatar";
import FlyerGenerator from "@/components/FlyerGenerator";
import jsPDF from "jspdf";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event } = useEvent(id);
  const { data: players = [] } = usePlayers();
  const { data: convoked = [] } = useEventConvocations(id);
  const { data: absences = [] } = useScheduledAbsences(id);
  const { data: teamSettings } = useTeamSettings();
  const saveConvocations = useSaveConvocations();
  const saveAbsences = useSaveScheduledAbsences();
  const updateEvent = useUpdateEvent();
  const logoRef = useRef<HTMLInputElement>(null);
  const [showFlyer, setShowFlyer] = useState(false);

  const activePlayers = players.filter(p => p.status === "Ativo");

  const [showSelector, setShowSelector] = useState(false);
  const [showAbsenceSelector, setShowAbsenceSelector] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedAbsences, setSelectedAbsences] = useState<string[]>([]);

  if (!event) {
    return <div className="px-4 py-10 text-center text-muted-foreground">Evento não encontrado</div>;
  }

  const togglePlayer = (playerId: string) => {
    setSelected(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const toggleAbsence = (playerId: string) => {
    setSelectedAbsences(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const handleSaveConvocation = async () => {
    await saveConvocations.mutateAsync({ eventId: event.id, playerIds: selected });
    setShowSelector(false);
  };

  const handleSaveAbsences = async () => {
    await saveAbsences.mutateAsync({ eventId: event.id, playerIds: selectedAbsences });
    setShowAbsenceSelector(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = `opponents/${Date.now()}-${file.name}`;
      const url = await uploadPhoto("photos", path, file);
      await updateEvent.mutateAsync({ id: event.id, opponent_logo_url: url });
    }
  };

  const convokedPlayers = activePlayers.filter(p => convoked.includes(p.id));
  const absentPlayers = activePlayers.filter(p => absences.includes(p.id));

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRITO UNIÃO", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Relação de Jogo - ${event.type}`, pageWidth / 2, 28, { align: "center" });
    let y = 40;
    if (event.opponent) { doc.setFont("helvetica", "bold"); doc.text(`vs. ${event.opponent}`, pageWidth / 2, y, { align: "center" }); y += 8; }
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${new Date(event.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, 20, y); y += 7;
    doc.text(`Horário: ${event.time}`, 20, y); y += 7;
    doc.text(`Local: ${event.location}`, 20, y); y += 12;
    doc.line(20, y, pageWidth - 20, y); y += 8;
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(`Convocados (${convokedPlayers.length})`, 20, y); y += 8;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    if (convokedPlayers.length === 0) { doc.text("Nenhum atleta convocado", 20, y); y += 7; }
    else {
      doc.setFont("helvetica", "bold"); doc.text("#", 20, y); doc.text("Nome", 35, y); doc.text("Posição", 110, y); y += 2;
      doc.line(20, y, pageWidth - 20, y); y += 5; doc.setFont("helvetica", "normal");
      convokedPlayers.forEach(player => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${player.number}`, 20, y); doc.text(player.name, 35, y); doc.text((player.positions || []).join(", "), 110, y); y += 7;
      });
    }
    if (absentPlayers.length > 0) {
      y += 8; doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text(`Ausências Programadas (${absentPlayers.length})`, 20, y); y += 8;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      absentPlayers.forEach(player => { if (y > 270) { doc.addPage(); y = 20; } doc.text(`${player.number} - ${player.name}`, 20, y); y += 7; });
    }
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth / 2, 290, { align: "center" });
    doc.save(`relacao-${event.type.toLowerCase()}-${event.date}.pdf`);
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-bold">Detalhes do Evento</h2>
      </div>

      <div className="px-4 mb-4">
        <div className="card-elevated">
          <div className="flex items-center gap-4 mb-4">
            {teamSettings?.team_logo_url && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                <img src={teamSettings.team_logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">{event.type}</span>
              {event.opponent && <p className="text-lg font-bold mt-1 flex items-center gap-2"><Swords size={16} className="text-primary" />vs. {event.opponent}</p>}
            </div>
            {event.opponent && (
              <button onClick={() => logoRef.current?.click()} className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                {event.opponent_logo_url ? <img src={event.opponent_logo_url} alt="Logo adversário" className="w-full h-full object-cover" /> : <Upload size={16} className="text-muted-foreground" />}
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground"><CalendarCheck size={14} /><span>{new Date(event.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
            <div className="flex items-center gap-3 text-muted-foreground"><Clock size={14} /><span>{event.time}</span></div>
            <div className="flex items-center gap-3 text-muted-foreground"><MapPin size={14} /><span>{event.location}</span></div>
          </div>
        </div>
      </div>

      {/* Convocation */}
      <div className="px-4 mb-4">
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users size={14} /> Convocados ({convoked.length})</h4>
            <button onClick={() => { setSelected(convoked); setShowSelector(true); }} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"><Plus size={16} /></button>
          </div>
          {convokedPlayers.length > 0 ? (
            <div className="space-y-2">
              {convokedPlayers.map(player => (
                <div key={player.id} className="flex items-center gap-3 py-1.5">
                  <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground">Nenhum atleta convocado ainda.</p>}
        </div>
      </div>

      {/* Scheduled Absences */}
      <div className="px-4 mb-4">
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Ban size={14} /> Ausências Programadas ({absences.length})</h4>
            <button onClick={() => { setSelectedAbsences(absences); setShowAbsenceSelector(true); }} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center text-destructive"><Plus size={16} /></button>
          </div>
          {absentPlayers.length > 0 ? (
            <div className="space-y-2">
              {absentPlayers.map(player => (
                <div key={player.id} className="flex items-center gap-3 py-1.5">
                  <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                  </div>
                  <span className="badge-pending text-[10px]">Ausente</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground">Nenhuma ausência programada.</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 space-y-3">
        <button onClick={() => navigate(`/compromissos/${event.id}`)} className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2"><CalendarCheck size={16} />Fazer Chamada</button>
        {event.opponent && (
          <button onClick={() => setShowFlyer(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"><ImageIcon size={16} />Gerar Flyer</button>
        )}
        <button onClick={exportPDF} className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 border border-primary/30"><FileDown size={16} />Exportar Relação em PDF</button>
      </div>

      {/* Player Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Selecionar Convocados</h3>
              <span className="text-xs text-muted-foreground">{selected.length} selecionados</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {activePlayers.map(player => {
                const isSelected = selected.includes(player.id);
                return (
                  <button key={player.id} onClick={() => togglePlayer(player.id)} className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"}`}>
                    <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {isSelected && <Check size={12} className="text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-4 border-t border-border flex gap-3">
              <button onClick={() => setShowSelector(false)} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm">Cancelar</button>
              <button onClick={handleSaveConvocation} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Confirmar ({selected.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* Absence Selector Modal */}
      {showAbsenceSelector && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Programar Ausências</h3>
              <span className="text-xs text-muted-foreground">{selectedAbsences.length} ausentes</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {activePlayers.map(player => {
                const isAbsent = selectedAbsences.includes(player.id);
                return (
                  <button key={player.id} onClick={() => toggleAbsence(player.id)} className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${isAbsent ? "bg-destructive/10 border border-destructive/30" : "hover:bg-secondary/50"}`}>
                    <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isAbsent ? "bg-destructive border-destructive" : "border-muted-foreground"}`}>
                      {isAbsent && <Ban size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-4 border-t border-border flex gap-3">
              <button onClick={() => setShowAbsenceSelector(false)} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm">Cancelar</button>
              <button onClick={handleSaveAbsences} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm">Confirmar ({selectedAbsences.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
