import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, HeartCrack } from "lucide-react";
import { usePlayers, useMonthlyPayments } from "@/hooks/useSupabase";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Input } from "@/components/ui/input";

const positions = ["Todos", "Goleiro", "Zagueiro", "Lateral", "Meio-campo", "Atacante"];
const statuses = ["Ativo", "Inativo"];

const Squad = () => {
  const navigate = useNavigate();
  const { data: players = [], isLoading } = usePlayers();
  const { data: payments = [] } = useMonthlyPayments();
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const getPendingMonths = (playerId: string) =>
    payments.filter(p => p.player_id === playerId && !p.paid).length;

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.nickname.toLowerCase().includes(search.toLowerCase());
    const matchPos = posFilter === "Todos" || (p.positions || []).includes(posFilter);
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchSearch && matchPos && matchStatus;
  });

  return (
    <div className="px-4 py-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Elenco</h2>
        <button onClick={() => navigate("/novo-atleta")} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Plus size={18} />
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar atleta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {positions.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${posFilter === pos ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{pos}</button>
        ))}
      </div>

      <div className="flex gap-2">
        {statuses.map(st => (
          <button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === st ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{st}</button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(player => {
            const pending = getPendingMonths(player.id);
            return (
              <div key={player.id} onClick={() => navigate(`/jogador/${player.id}`)} className="card-elevated flex items-center gap-3 cursor-pointer hover:border-primary/20 transition-colors">
                <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="md" satisfaction={player.satisfaction as any} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{player.name}</p>
                    {player.injured && <HeartCrack size={14} className="text-destructive shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{(player.positions || []).join(", ")}</span>
                    <span className="text-xs text-muted-foreground">#{player.number}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {pending === 0 ? <span className="badge-ok">Em dia</span> : <span className="badge-pending">{pending} pend.</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum atleta encontrado</p>
      )}
    </div>
  );
};

export default Squad;
