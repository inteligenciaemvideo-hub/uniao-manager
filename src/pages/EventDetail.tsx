import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CalendarCheck, Swords, Users, Check, Plus, Upload, FileDown, Ban, Image as ImageIcon, UserPlus, X, AlertTriangle, Instagram, Trophy, Target, Handshake, Minus, SquareSlash, CircleX } from "lucide-react";
import { useEvent, usePlayers, useEventConvocations, useSaveConvocations, useScheduledAbsences, useSaveScheduledAbsences, useTeamSettings, useUpdateEvent, uploadPhoto, useEventGuests, useSaveEventGuests, useMatchEvents, useSaveMatchEvents, useRecalculatePlayerStats, useSponsors, useAddSponsor, useDeleteSponsor } from "@/hooks/useSupabase";
import PlayerAvatar from "@/components/PlayerAvatar";
import FlyerGenerator from "@/components/FlyerGenerator";
import ConvocationCard from "@/components/ConvocationCard";
import ResultFlyerGenerator from "@/components/ResultFlyerGenerator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import jsPDF from "jspdf";

const MIN_CONVOCADOS = 7;
const MAX_CONVOCADOS = 13;

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event } = useEvent(id);
  const { data: players = [] } = usePlayers();
  const { data: convoked = [] } = useEventConvocations(id);
  const { data: absences = [] } = useScheduledAbsences(id);
  const { data: teamSettings } = useTeamSettings();
  const { data: guests = [] } = useEventGuests(id);
  const { data: matchEvents = [] } = useMatchEvents(id);
  const { data: sponsors = [] } = useSponsors();
  const saveConvocations = useSaveConvocations();
  const saveAbsences = useSaveScheduledAbsences();
  const saveGuests = useSaveEventGuests();
  const updateEvent = useUpdateEvent();
  const saveMatchEvents = useSaveMatchEvents();
  const recalcStats = useRecalculatePlayerStats();
  const addSponsor = useAddSponsor();
  const deleteSponsor = useDeleteSponsor();
  const sponsorLogoRef2 = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [showFlyer, setShowFlyer] = useState(false);
  const [showConvocationCard, setShowConvocationCard] = useState(false);
  const [showPostMatch, setShowPostMatch] = useState(false);
  const [showResultFlyer, setShowResultFlyer] = useState(false);

  const activePlayers = players.filter(p => p.status === "Ativo");

  const [showSelector, setShowSelector] = useState(false);
  const [showAbsenceSelector, setShowAbsenceSelector] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedAbsences, setSelectedAbsences] = useState<string[]>([]);
  const [guestNicknames, setGuestNicknames] = useState<string[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [convocationConfirmed, setConvocationConfirmed] = useState(convoked.length > 0);

  // Post-match state
  const [homeScore, setHomeScore] = useState<number>(event?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState<number>(event?.away_score ?? 0);
  const [goalEntries, setGoalEntries] = useState<{ player_id: string; type: string }[]>([]);

  useEffect(() => {
    if (event) {
      setHomeScore(event.home_score ?? 0);
      setAwayScore(event.away_score ?? 0);
    }
  }, [event?.id, event?.home_score, event?.away_score]);

  useEffect(() => {
    if (matchEvents.length > 0) {
      setGoalEntries(matchEvents.map((e: any) => ({ player_id: e.player_id, type: e.type })));
    }
  }, [matchEvents]);

  if (!event) {
    return <div className="px-4 py-10 text-center text-muted-foreground">Evento não encontrado</div>;
  }

  const togglePlayer = (playerId: string) => {
    setSelected(prev => {
      const isSelected = prev.includes(playerId);
      if (isSelected) return prev.filter(id => id !== playerId);
      if (prev.length + guestNicknames.length >= MAX_CONVOCADOS) {
        toast.error(`Máximo de ${MAX_CONVOCADOS} convocados atingido`);
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const toggleAbsence = (playerId: string) => {
    setSelectedAbsences(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const addGuest = () => {
    const name = newGuestName.trim();
    if (!name) return;
    if (selected.length + guestNicknames.length >= MAX_CONVOCADOS) {
      toast.error(`Máximo de ${MAX_CONVOCADOS} convocados atingido`);
      return;
    }
    setGuestNicknames(prev => [...prev, name]);
    setNewGuestName("");
  };

  const removeGuest = (index: number) => {
    setGuestNicknames(prev => prev.filter((_, i) => i !== index));
  };

  const totalConvocados = selected.length + guestNicknames.length;
  const canConfirm = totalConvocados >= MIN_CONVOCADOS && totalConvocados <= MAX_CONVOCADOS;

  const handleSaveConvocation = async () => {
    if (!canConfirm) {
      toast.error(`Selecione entre ${MIN_CONVOCADOS} e ${MAX_CONVOCADOS} atletas`);
      return;
    }
    try {
      await saveConvocations.mutateAsync({ eventId: event.id, playerIds: selected });
      await saveGuests.mutateAsync({ eventId: event.id, nicknames: guestNicknames });
      setConvocationConfirmed(true);
      setShowSelector(false);
      toast.success("Convocação confirmada!");
    } catch {
      toast.error("Erro ao salvar convocação");
    }
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

  const openConvocationSelector = () => {
    setSelected(convoked);
    setGuestNicknames(guests.map((g: any) => g.nickname));
    setShowSelector(true);
  };

  // ============ PROFESSIONAL PDF EXPORT ============
  const exportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const BLUE = [13, 27, 62]; // #0d1b3e
    const BLUE_HEADER = [26, 58, 122]; // #1a3a7a
    const WHITE_RGB = [255, 255, 255];
    const GRAY = [136, 153, 187];

    // Header band
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(0, 0, pw, 45, "F");

    // Title
    doc.setTextColor(WHITE_RGB[0], WHITE_RGB[1], WHITE_RGB[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DISTRITO UNIÃO FC", pw / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("RELATÓRIO DE CONVOCAÇÃO", pw / 2, 28, { align: "center" });

    if (event.opponent) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`VS ${event.opponent.toUpperCase()}`, pw / 2, 40, { align: "center" });
    }

    // Event info
    let y = 58;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const formattedDate = new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    doc.text(`📅  ${formattedDate}`, 20, y); y += 7;
    doc.text(`⏰  ${event.time}`, 20, y); y += 7;
    doc.text(`📍  ${event.location}`, 20, y); y += 12;

    // Table header
    doc.setFillColor(BLUE_HEADER[0], BLUE_HEADER[1], BLUE_HEADER[2]);
    doc.rect(15, y, pw - 30, 10, "F");
    doc.setTextColor(WHITE_RGB[0], WHITE_RGB[1], WHITE_RGB[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("#", 20, y + 7);
    doc.text("NOME DO ATLETA", 35, y + 7);
    doc.text("POSIÇÃO", 120, y + 7);
    doc.text("Nº", pw - 25, y + 7, { align: "center" });
    y += 14;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    convokedPlayers.forEach((player, i) => {
      if (y > 272) { doc.addPage(); y = 20; }
      // Alternate row bg
      if (i % 2 === 0) {
        doc.setFillColor(240, 243, 250);
        doc.rect(15, y - 4, pw - 30, 9, "F");
      }
      doc.setTextColor(30, 30, 30);
      doc.text(`${i + 1}`, 20, y + 2);
      doc.text(player.name, 35, y + 2);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text((player.positions || []).join(", "), 120, y + 2);
      doc.setTextColor(30, 30, 30);
      doc.text(`${player.number}`, pw - 25, y + 2, { align: "center" });
      y += 9;
    });

    // Guests
    guests.forEach((g: any, i: number) => {
      if (y > 272) { doc.addPage(); y = 20; }
      if ((convokedPlayers.length + i) % 2 === 0) {
        doc.setFillColor(255, 249, 235);
        doc.rect(15, y - 4, pw - 30, 9, "F");
      }
      doc.setTextColor(180, 140, 20);
      doc.text("★", 20, y + 2);
      doc.text(`${g.nickname} (Convidado)`, 35, y + 2);
      y += 9;
    });

    // Absences
    if (absentPlayers.length > 0) {
      y += 8;
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.rect(15, y, pw - 30, 10, "F");
      doc.setTextColor(WHITE_RGB[0], WHITE_RGB[1], WHITE_RGB[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`AUSÊNCIAS PROGRAMADAS (${absentPlayers.length})`, 20, y + 7);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      absentPlayers.forEach((player, i) => {
        if (y > 272) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
          doc.setFillColor(255, 240, 240);
          doc.rect(15, y - 4, pw - 30, 9, "F");
        }
        doc.setTextColor(180, 60, 60);
        doc.text(`${player.number} - ${player.name}`, 20, y + 2);
        y += 9;
      });
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}  •  Distrito União FC`, pw / 2, 290, { align: "center" });

    doc.save(`escalacao_distrito_uniao_${event.date}.pdf`);
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
            {event.home_score !== null && event.away_score !== null && (
              <div className="flex items-center gap-3 mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy size={14} className="text-primary" />
                <span className="text-sm font-bold text-foreground">
                  Distrito União {event.home_score} × {event.away_score} {event.opponent || "Adversário"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convocation */}
      <div className="px-4 mb-4">
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users size={14} /> Convocados ({convoked.length + guests.length})
              {convocationConfirmed && convoked.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success ml-1">Confirmada</span>
              )}
            </h4>
            <button onClick={openConvocationSelector} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"><Plus size={16} /></button>
          </div>
          {convokedPlayers.length > 0 || guests.length > 0 ? (
            <div className="space-y-2">
              {convokedPlayers.map(player => (
                <div key={player.id} className="flex items-center gap-3 py-1.5">
                  <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                  </div>
                  <Check size={14} className="text-success" />
                </div>
              ))}
              {guests.map((g: any) => (
                <div key={g.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    <UserPlus size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.nickname}</p>
                    <p className="text-[10px] text-yellow-500 font-semibold">Convidado</p>
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
        {!convocationConfirmed && convoked.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-medium">
            <AlertTriangle size={14} />
            Confirme a convocação antes de fazer a chamada
          </div>
        )}
        <button
          onClick={() => navigate(`/compromissos/${event.id}`)}
          disabled={!convocationConfirmed && convoked.length === 0}
          className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarCheck size={16} />Fazer Chamada
        </button>

        {event.opponent && (
          <button onClick={() => setShowFlyer(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
            <ImageIcon size={16} />Gerar Flyer do Jogo
          </button>
        )}

        {/* PDF & Instagram buttons - only after convocation confirmed */}
        {convocationConfirmed && (convoked.length > 0 || guests.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportPDF}
              className="py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 border border-primary/30"
            >
              <FileDown size={16} />Lista PDF
            </button>
            <button
              onClick={() => setShowConvocationCard(true)}
              className="py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 border border-primary/30"
            >
              <Instagram size={16} />Card Instagram
            </button>
          </div>
        )}

        {/* Post-match button - for Jogo, Amistoso, Torneio */}
        {(event.type === "Jogo" || event.type === "Amistoso" || event.type === "Torneio") && convocationConfirmed && convoked.length > 0 && (
          <>
            <button
              onClick={() => setShowPostMatch(true)}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Trophy size={16} />Pós-Jogo (Resultado & Stats)
            </button>
            {event.home_score !== null && event.away_score !== null && (
              <button
                onClick={() => setShowResultFlyer(true)}
                className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 border border-primary/30"
              >
                <Instagram size={16} />Flyer de Resultado
              </button>
            )}
          </>
        )}
      </div>

      {/* Sponsors Management */}
      <div className="px-4 mb-4 mt-4">
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon size={14} /> Patrocinadores ({sponsors.length})
            </h4>
            <button
              onClick={() => sponsorLogoRef2.current?.click()}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"
            >
              <Plus size={16} />
            </button>
            <input
              ref={sponsorLogoRef2}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const name = prompt("Nome do patrocinador:");
                if (!name) return;
                try {
                  const path = `sponsors/${Date.now()}-${file.name}`;
                  const url = await uploadPhoto("photos", path, file);
                  await addSponsor.mutateAsync({ name, logo_url: url });
                  toast.success("Patrocinador adicionado!");
                } catch {
                  toast.error("Erro ao adicionar patrocinador");
                }
              }}
            />
          </div>
          {sponsors.length > 0 ? (
            <div className="space-y-2">
              {sponsors.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  {s.logo_url && (
                    <img src={s.logo_url} alt={s.name} className="w-10 h-10 object-contain rounded bg-secondary p-1" />
                  )}
                  <span className="text-sm font-medium flex-1">{s.name}</span>
                  <button
                    onClick={async () => {
                      await deleteSponsor.mutateAsync(s.id);
                      toast.success("Patrocinador removido");
                    }}
                    className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center"
                  >
                    <X size={12} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum patrocinador cadastrado. Toque em + para adicionar.</p>
          )}
        </div>
      </div>

      {/* Player Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="w-full bg-card rounded-t-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            {/* Header - fixed */}
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold">Selecionar Convocados</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${totalConvocados < MIN_CONVOCADOS ? "text-destructive" : totalConvocados > MAX_CONVOCADOS ? "text-destructive" : "text-success"}`}>
                  {totalConvocados}/{MAX_CONVOCADOS}
                </span>
                <button onClick={() => setShowSelector(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-4 py-2 bg-secondary/30 border-b border-border shrink-0">
              <p className="text-[10px] text-muted-foreground">
                Mínimo <span className="font-bold text-foreground">{MIN_CONVOCADOS}</span> e máximo <span className="font-bold text-foreground">{MAX_CONVOCADOS}</span> atletas (incluindo convidados)
              </p>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-1">
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

              {/* Guest section */}
              <div className="pt-3 mt-2 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <UserPlus size={12} /> Convidados
                </h4>
                {guestNicknames.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 mb-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <UserPlus size={14} className="text-yellow-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-[10px] text-yellow-500">Convidado</p>
                    </div>
                    <button onClick={() => removeGuest(i)} className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X size={12} className="text-destructive" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Apelido do convidado"
                    value={newGuestName}
                    onChange={e => setNewGuestName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addGuest()}
                    className="flex-1 h-9 text-sm bg-secondary/30 border-border"
                  />
                  <button
                    onClick={addGuest}
                    disabled={!newGuestName.trim() || totalConvocados >= MAX_CONVOCADOS}
                    className="h-9 px-3 rounded-lg bg-yellow-500/20 text-yellow-500 text-xs font-semibold disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Footer - ALWAYS visible */}
            <div className="px-4 py-4 border-t border-border bg-card shrink-0 space-y-3">
              {!canConfirm && totalConvocados > 0 && (
                <p className="text-[10px] text-destructive text-center font-medium">
                  {totalConvocados < MIN_CONVOCADOS
                    ? `Selecione pelo menos ${MIN_CONVOCADOS} atletas (faltam ${MIN_CONVOCADOS - totalConvocados})`
                    : `Máximo de ${MAX_CONVOCADOS} atletas ultrapassado`}
                </p>
              )}
              <button
                onClick={handleSaveConvocation}
                disabled={!canConfirm || saveConvocations.isPending}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {saveConvocations.isPending ? "Salvando..." : `Confirmar Escalação (${totalConvocados})`}
              </button>
              <button
                onClick={() => {
                  if (canConfirm) {
                    handleSaveConvocation().then(() => setShowConvocationCard(true));
                  }
                }}
                disabled={!canConfirm || saveConvocations.isPending}
                className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm border border-primary/30 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <FileDown size={16} />
                Exportar Convocação
              </button>
              <button onClick={() => setShowSelector(false)} className="w-full py-2.5 text-muted-foreground text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absence Selector Modal */}
      {showAbsenceSelector && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Ausências Programadas</h3>
              <span className="text-xs text-muted-foreground">{selectedAbsences.length} selecionados</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {activePlayers.map(player => {
                const isSelected = selectedAbsences.includes(player.id);
                return (
                  <button key={player.id} onClick={() => toggleAbsence(player.id)} className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${isSelected ? "bg-destructive/10 border border-destructive/30" : "hover:bg-secondary/50"}`}>
                    <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(player.positions || []).join(", ")} · #{player.number}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? "bg-destructive border-destructive" : "border-muted-foreground"}`}>
                      {isSelected && <Check size={12} className="text-destructive-foreground" />}
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

      {/* Flyer Generator */}
      {event.opponent && (
        <FlyerGenerator
          open={showFlyer}
          onClose={() => setShowFlyer(false)}
          eventType={event.type}
          opponent={event.opponent}
          date={event.date}
          time={event.time}
          location={event.location}
          opponentLogoUrl={event.opponent_logo_url}
          homeScore={(event as any).home_score}
          awayScore={(event as any).away_score}
          sponsors={sponsors}
        />
      )}

      {/* Convocation Instagram Card */}
      <ConvocationCard
        open={showConvocationCard}
        onClose={() => setShowConvocationCard(false)}
        eventType={event.type}
        opponent={event.opponent || ""}
        date={event.date}
        time={event.time}
        location={event.location}
        players={convokedPlayers.map(p => ({ name: p.name, nickname: p.nickname, number: p.number, positions: p.positions || [] }))}
        guests={guests.map((g: any) => ({ nickname: g.nickname }))}
        sponsors={sponsors}
      />

      {/* Post-Match Modal */}
      {showPostMatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="w-full bg-card rounded-t-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-2"><Trophy size={16} className="text-primary" /> Pós-Jogo</h3>
              <button onClick={() => setShowPostMatch(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-6">
              {/* Score */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Placar</h4>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Distrito União</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Minus size={14} /></button>
                      <span className="text-2xl font-bold w-10 text-center">{homeScore}</span>
                      <button onClick={() => setHomeScore(homeScore + 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-muted-foreground">×</span>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{event.opponent || "Adversário"}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Minus size={14} /></button>
                      <span className="text-2xl font-bold w-10 text-center">{awayScore}</span>
                      <button onClick={() => setAwayScore(awayScore + 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal & Assist entries */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Target size={14} className="text-primary" /> Gols & Assistências
                </h4>
                <div className="space-y-2 mb-3">
                  {goalEntries.map((entry, i) => {
                    const player = convokedPlayers.find(p => p.id === entry.player_id);
                    const typeLabels: Record<string, { label: string; cls: string }> = {
                      goal: { label: "⚽ Gol", cls: "bg-primary/20 text-primary" },
                      assist: { label: "👟 Assist.", cls: "bg-accent/20 text-accent-foreground" },
                      yellow_card: { label: "🟨 Amarelo", cls: "bg-yellow-500/20 text-yellow-400" },
                      red_card: { label: "🟥 Vermelho", cls: "bg-destructive/20 text-destructive" },
                    };
                    const t = typeLabels[entry.type] || typeLabels.goal;
                    return (
                      <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/50">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.cls}`}>
                          {t.label}
                        </span>
                        <span className="text-sm flex-1">{player?.name || "?"}</span>
                        <button onClick={() => setGoalEntries(prev => prev.filter((_, idx) => idx !== i))} className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                          <X size={12} className="text-destructive" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted-foreground mb-2">Toque no atleta para adicionar gol, assistência ou cartão:</p>
                {convokedPlayers.map(player => {
                  const playerGoals = goalEntries.filter(e => e.player_id === player.id && e.type === "goal").length;
                  const playerAssists = goalEntries.filter(e => e.player_id === player.id && e.type === "assist").length;
                  const playerYellows = goalEntries.filter(e => e.player_id === player.id && e.type === "yellow_card").length;
                  const playerReds = goalEntries.filter(e => e.player_id === player.id && e.type === "red_card").length;
                  return (
                    <div key={player.id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                      <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{player.name}</p>
                        <p className="text-[10px] text-muted-foreground">#{player.number}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <button
                          onClick={() => setGoalEntries(prev => [...prev, { player_id: player.id, type: "goal" }])}
                          className="h-7 px-2 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1 border border-primary/30"
                        >
                          <Target size={10} /> ⚽ {playerGoals > 0 && `(${playerGoals})`}
                        </button>
                        <button
                          onClick={() => setGoalEntries(prev => [...prev, { player_id: player.id, type: "assist" }])}
                          className="h-7 px-2 rounded-lg bg-accent/10 text-accent-foreground text-[10px] font-bold flex items-center gap-1 border border-accent/30"
                        >
                          <Handshake size={10} /> 👟 {playerAssists > 0 && `(${playerAssists})`}
                        </button>
                        <button
                          onClick={() => setGoalEntries(prev => [...prev, { player_id: player.id, type: "yellow_card" }])}
                          className="h-7 px-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-[10px] font-bold flex items-center gap-1 border border-yellow-500/30"
                        >
                          <SquareSlash size={10} /> 🟨 {playerYellows > 0 && `(${playerYellows})`}
                        </button>
                        <button
                          onClick={() => setGoalEntries(prev => [...prev, { player_id: player.id, type: "red_card" }])}
                          className="h-7 px-2 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold flex items-center gap-1 border border-destructive/30"
                        >
                          <CircleX size={10} /> 🟥 {playerReds > 0 && `(${playerReds})`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border bg-card shrink-0 space-y-3">
              <button
                onClick={async () => {
                  try {
                    await updateEvent.mutateAsync({ id: event.id, home_score: homeScore, away_score: awayScore });
                    await saveMatchEvents.mutateAsync({ eventId: event.id, events: goalEntries });
                    await recalcStats.mutateAsync();
                    setShowPostMatch(false);
                    toast.success("Resultado e estatísticas salvos!");
                  } catch {
                    toast.error("Erro ao salvar resultado");
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              >
                <Check size={16} /> Salvar Resultado
              </button>
              <button onClick={() => setShowPostMatch(false)} className="w-full py-2.5 text-muted-foreground text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
