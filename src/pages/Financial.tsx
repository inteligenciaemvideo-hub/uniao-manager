import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, CheckCircle2, XCircle } from "lucide-react";
import { usePlayers, useFinancials, useMonthlyPayments } from "@/hooks/useSupabase";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

const Financial = () => {
  const [tab, setTab] = useState<"todos" | "entradas" | "saidas" | "mensalidades">("mensalidades");
  const { data: financials = [] } = useFinancials();
  const { data: players = [] } = usePlayers();
  const { data: payments = [] } = useMonthlyPayments();

  const activePlayers = players.filter(p => p.status === "Ativo");

  const totalIn = financials.filter(f => f.type === "entrada").reduce((s, f) => s + Number(f.amount), 0);
  const totalOut = financials.filter(f => f.type === "saida").reduce((s, f) => s + Number(f.amount), 0);
  const balance = totalIn - totalOut;

  const filtered = tab === "todos" ? financials :
    tab === "mensalidades" ? [] :
    financials.filter(f => tab === "entradas" ? f.type === "entrada" : f.type === "saida");

  const getPaymentStatus = (playerId: string, month: string) => {
    const p = payments.find(pay => pay.player_id === playerId && pay.month === month);
    return p ? p.paid : undefined;
  };

  const getPendingMonths = (playerId: string) =>
    payments.filter(p => p.player_id === playerId && !p.paid).length;

  return (
    <div className="px-4 py-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Financeiro</h2>
        <button className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Plus size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated text-center gold-glow border-primary/30">
          <DollarSign size={16} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-primary">R$ {balance}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingUp size={16} className="mx-auto text-success mb-1" />
          <p className="text-lg font-bold text-success">R$ {totalIn}</p>
          <p className="text-[10px] text-muted-foreground">Entradas</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingDown size={16} className="mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold text-destructive">R$ {totalOut}</p>
          <p className="text-[10px] text-muted-foreground">Saídas</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["mensalidades", "todos", "entradas", "saidas"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {t === "saidas" ? "Saídas" : t === "mensalidades" ? "Mensalidades" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "mensalidades" && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Atleta</th>
                  {months.map(m => <th key={m} className="text-center py-2 px-1 text-muted-foreground font-medium">{m}</th>)}
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activePlayers.map(player => {
                  const pending = getPendingMonths(player.id);
                  return (
                    <tr key={player.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium truncate max-w-[80px]">{player.nickname}</span>
                        </div>
                      </td>
                      {months.map(month => {
                        const paid = getPaymentStatus(player.id, month);
                        return (
                          <td key={month} className="text-center py-2.5 px-1">
                            {paid === undefined ? <span className="text-muted-foreground">—</span> : paid ? <CheckCircle2 size={16} className="mx-auto text-success" /> : <XCircle size={16} className="mx-auto text-destructive" />}
                          </td>
                        );
                      })}
                      <td className="text-center py-2.5 px-2">
                        {pending === 0 ? <span className="badge-ok text-[9px]">OK</span> : <span className="badge-pending text-[9px]">{pending}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab !== "mensalidades" && (
        <div className="space-y-2">
          {filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
            <div key={entry.id} className="card-elevated flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.type === "entrada" ? "bg-success/20" : "bg-destructive/20"}`}>
                  {entry.type === "entrada" ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{entry.description}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.category} · {new Date(entry.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${entry.type === "entrada" ? "text-success" : "text-destructive"}`}>
                {entry.type === "entrada" ? "+" : "-"}R$ {Number(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Financial;
