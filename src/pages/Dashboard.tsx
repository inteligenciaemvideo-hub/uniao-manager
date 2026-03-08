import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, CalendarCheck, Swords, AlertTriangle, Trophy, Plus, ClipboardList, CreditCard, Image } from "lucide-react";
import { usePlayers, useEvents, useFinancials, useMonthlyPayments, useTeamSettings } from "@/hooks/useSupabase";
import PlayerAvatar from "@/components/PlayerAvatar";
import FlyerGenerator from "@/components/FlyerGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: players = [] } = usePlayers();
  const { data: events = [] } = useEvents();
  const { data: financials = [] } = useFinancials();
  const { data: payments = [] } = useMonthlyPayments();
  const { data: teamSettings } = useTeamSettings();

  const activePlayers = players.filter(p => p.status === "Ativo");

  const totalReceived = financials.filter(f => f.type === "entrada").reduce((sum, f) => sum + Number(f.amount), 0);
  const totalExpenses = financials.filter(f => f.type === "saida").reduce((sum, f) => sum + Number(f.amount), 0);
  const balance = totalReceived - totalExpenses;

  // Compute pending months per player
  const getPendingMonths = (playerId: string) =>
    payments.filter(p => p.player_id === playerId && !p.paid).length;

  const nextGame = events.find(e => e.opponent);
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 3);

  // Alerts: players with 2+ pending months
  const alerts = activePlayers
    .map(p => {
      const pending = getPendingMonths(p.id);
      const reasons: string[] = [];
      if (pending >= 2) reasons.push(`${pending} mens. atrasadas`);
      return { player: p, reasons };
    })
    .filter(a => a.reasons.length > 0);

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated flex flex-col gap-2" onClick={() => navigate("/elenco")}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Users size={16} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Atletas</span>
          </div>
          <p className="text-2xl font-bold">{activePlayers.length}</p>
          <p className="text-[10px] text-muted-foreground">{players.filter(p => p.status === "Inativo").length} inativos</p>
        </div>

        <div className="card-elevated flex flex-col gap-2 gold-glow border-primary/30" onClick={() => navigate("/financeiro")}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <DollarSign size={16} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Saldo</span>
          </div>
          <p className="text-2xl font-bold text-primary">R$ {balance}</p>
          <p className="text-[10px] text-muted-foreground">Mensalidades recebidas</p>
        </div>

        <div className="card-elevated flex flex-col gap-2" onClick={() => navigate("/compromissos")}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <CalendarCheck size={16} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Compromissos</span>
          </div>
          <p className="text-2xl font-bold">{events.length}</p>
          <p className="text-[10px] text-muted-foreground">{events.length} eventos registrados</p>
        </div>

        <div className="card-elevated flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Swords size={16} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Próximo Jogo</span>
          </div>
          <p className="text-sm font-bold">vs. {nextGame?.opponent || "—"}</p>
          <p className="text-[10px] text-muted-foreground">{nextGame?.date ? new Date(nextGame.date).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card-elevated border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">
              Alertas ({alerts.length})
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map(({ player, reasons }) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer"
                onClick={() => navigate(`/jogador/${player.id}`)}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                  <span className="text-sm font-medium">{player.name}</span>
                </div>
                <div className="flex gap-1.5">
                  {reasons.map((r, i) => (
                    <span key={i} className="badge-pending text-[10px]">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-elevated">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Artilheiros</span>
        </div>
        <div className="space-y-2">
          {topScorers.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between py-2 cursor-pointer" onClick={() => navigate(`/jogador/${player.id}`)}>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold w-6 text-center ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>{index + 1}</span>
                <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
                <span className="text-sm font-medium">{player.name}</span>
              </div>
              <span className={`text-sm font-bold ${index === 0 ? "text-primary" : ""}`}>{player.goals} gols</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate("/compromissos")} className="card-elevated flex flex-col items-center gap-2 py-4 hover:border-primary/30 transition-colors">
          <ClipboardList size={20} className="text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Registrar Presença</span>
        </button>
        <button onClick={() => navigate("/financeiro")} className="card-elevated flex flex-col items-center gap-2 py-4 hover:border-primary/30 transition-colors">
          <CreditCard size={20} className="text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Novo Pagamento</span>
        </button>
        <button onClick={() => navigate("/elenco")} className="card-elevated flex flex-col items-center gap-2 py-4 hover:border-primary/30 transition-colors">
          <Plus size={20} className="text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">Novo Atleta</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
