import { Target, Handshake, SquareSlash, CircleX } from "lucide-react";
import { usePlayers } from "@/hooks/useSupabase";
import { useNavigate } from "react-router-dom";

const Stats = () => {
  const navigate = useNavigate();
  const { data: players = [] } = usePlayers();

  const scorers = [...players].sort((a, b) => b.goals - a.goals).filter(p => p.goals > 0);
  const assisters = [...players].sort((a, b) => b.assists - a.assists).filter(p => p.assists > 0);
  const carders = [...players].sort((a, b) => (b.yellow_cards + b.red_cards) - (a.yellow_cards + a.red_cards)).filter(p => p.yellow_cards + p.red_cards > 0);

  const totalGoals = players.reduce((s, p) => s + p.goals, 0);
  const totalAssists = players.reduce((s, p) => s + p.assists, 0);
  const totalYellows = players.reduce((s, p) => s + p.yellow_cards, 0);
  const totalReds = players.reduce((s, p) => s + p.red_cards, 0);

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold">Estatísticas da Temporada</h2>

      <div className="grid grid-cols-4 gap-2">
        <div className="card-elevated text-center py-3">
          <Target size={14} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{totalGoals}</p>
          <p className="text-[10px] text-muted-foreground">Gols</p>
        </div>
        <div className="card-elevated text-center py-3">
          <Handshake size={14} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{totalAssists}</p>
          <p className="text-[10px] text-muted-foreground">Assist.</p>
        </div>
        <div className="card-elevated text-center py-3">
          <SquareSlash size={14} className="mx-auto text-warning mb-1" />
          <p className="text-lg font-bold">{totalYellows}</p>
          <p className="text-[10px] text-muted-foreground">Amarelos</p>
        </div>
        <div className="card-elevated text-center py-3">
          <CircleX size={14} className="mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold">{totalReds}</p>
          <p className="text-[10px] text-muted-foreground">Vermelhos</p>
        </div>
      </div>

      <div className="card-elevated">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Target size={14} className="text-primary" /> Artilharia</h4>
        <div className="space-y-2">
          {scorers.map((player, i) => (
            <div key={player.id} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => navigate(`/jogador/${player.id}`)}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="text-sm">{player.name}</span>
              </div>
              <span className={`text-sm font-bold ${i === 0 ? "text-primary" : ""}`}>{player.goals}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Handshake size={14} className="text-primary" /> Assistências</h4>
        <div className="space-y-2">
          {assisters.map((player, i) => (
            <div key={player.id} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => navigate(`/jogador/${player.id}`)}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                <span className="text-sm">{player.name}</span>
              </div>
              <span className={`text-sm font-bold ${i === 0 ? "text-primary" : ""}`}>{player.assists}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><SquareSlash size={14} className="text-warning" /> Cartões</h4>
        <div className="space-y-2">
          {carders.map((player, i) => (
            <div key={player.id} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => navigate(`/jogador/${player.id}`)}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold w-5 text-center text-muted-foreground">{i + 1}</span>
                <span className="text-sm">{player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs badge-warning">{player.yellow_cards} 🟨</span>
                {player.red_cards > 0 && <span className="text-xs badge-pending">{player.red_cards} 🟥</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
