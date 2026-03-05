import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, CheckCircle2, XCircle, FileDown, FileSpreadsheet, X } from "lucide-react";
import { usePlayers, useFinancials, useMonthlyPayments, useAddFinancial } from "@/hooks/useSupabase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

const categoriesEntrada = ["Mensalidade", "Patrocínio", "Evento", "Doação", "Outros"];
const categoriesSaida = ["Material", "Arbitragem", "Campo", "Transporte", "Alimentação", "Outros"];

const Financial = () => {
  const [tab, setTab] = useState<"todos" | "entradas" | "saidas" | "mensalidades">("mensalidades");
  const { data: financials = [] } = useFinancials();
  const { data: players = [] } = usePlayers();
  const { data: payments = [] } = useMonthlyPayments();
  const addFinancial = useAddFinancial();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formType, setFormType] = useState<"entrada" | "saida">("entrada");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPlayerId, setFormPlayerId] = useState<string>("");

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

  const openForm = (type: "entrada" | "saida") => {
    setFormType(type);
    setFormDesc("");
    setFormAmount("");
    setFormCategory("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPlayerId("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formDesc || !formAmount || !formCategory || !formDate) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    try {
      await addFinancial.mutateAsync({
        type: formType,
        description: formDesc,
        amount: parseFloat(formAmount),
        category: formCategory,
        date: formDate,
        player_id: formPlayerId || undefined,
      });
      toast({ title: formType === "entrada" ? "Entrada registrada!" : "Saída registrada!" });
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório Financeiro", 14, 20);
    doc.setFontSize(10);
    doc.text(`Saldo: R$ ${balance.toFixed(2)}  |  Entradas: R$ ${totalIn.toFixed(2)}  |  Saídas: R$ ${totalOut.toFixed(2)}`, 14, 30);

    let y = 45;
    doc.setFontSize(12);
    doc.text("Lançamentos", 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.text("Data", 14, y);
    doc.text("Tipo", 44, y);
    doc.text("Categoria", 70, y);
    doc.text("Descrição", 105, y);
    doc.text("Valor", 170, y);
    y += 6;

    const sorted = [...financials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const entry of sorted) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(new Date(entry.date).toLocaleDateString("pt-BR"), 14, y);
      doc.text(entry.type === "entrada" ? "Entrada" : "Saída", 44, y);
      doc.text(entry.category, 70, y);
      doc.text(entry.description.substring(0, 30), 105, y);
      doc.text(`R$ ${Number(entry.amount).toFixed(2)}`, 170, y);
      y += 6;
    }

    if (payments.length > 0) {
      y += 10;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Mensalidades", 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.text("Atleta", 14, y);
      months.forEach((m, i) => doc.text(m, 60 + i * 20, y));
      y += 6;
      for (const player of activePlayers) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(player.nickname.substring(0, 15), 14, y);
        months.forEach((month, i) => {
          const paid = getPaymentStatus(player.id, month);
          doc.text(paid === undefined ? "—" : paid ? "✓" : "✗", 60 + i * 20, y);
        });
        y += 6;
      }
    }

    doc.save("financeiro.pdf");
    toast({ title: "PDF exportado!" });
  };

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Lançamentos sheet
    const launchData = [...financials]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(e => ({
        Data: new Date(e.date).toLocaleDateString("pt-BR"),
        Tipo: e.type === "entrada" ? "Entrada" : "Saída",
        Categoria: e.category,
        Descrição: e.description,
        Valor: Number(e.amount),
      }));
    const ws1 = XLSX.utils.json_to_sheet(launchData);
    XLSX.utils.book_append_sheet(wb, ws1, "Lançamentos");

    // Mensalidades sheet
    const payData = activePlayers.map(player => {
      const row: Record<string, string> = { Atleta: player.nickname };
      months.forEach(month => {
        const paid = getPaymentStatus(player.id, month);
        row[month] = paid === undefined ? "—" : paid ? "Pago" : "Pendente";
      });
      return row;
    });
    const ws2 = XLSX.utils.json_to_sheet(payData);
    XLSX.utils.book_append_sheet(wb, ws2, "Mensalidades");

    // Resumo sheet
    const ws3 = XLSX.utils.json_to_sheet([
      { Item: "Total Entradas", Valor: totalIn },
      { Item: "Total Saídas", Valor: totalOut },
      { Item: "Saldo", Valor: balance },
    ]);
    XLSX.utils.book_append_sheet(wb, ws3, "Resumo");

    XLSX.writeFile(wb, "financeiro.xlsx");
    toast({ title: "Planilha exportada!" });
  };

  const categories = formType === "entrada" ? categoriesEntrada : categoriesSaida;

  return (
    <div className="px-4 py-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Financeiro</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Exportar PDF">
            <FileDown size={16} />
          </button>
          <button onClick={exportXLSX} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Exportar Excel">
            <FileSpreadsheet size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Plus size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openForm("entrada")}>
                <TrendingUp size={14} className="mr-2 text-success" /> Nova Entrada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openForm("saida")}>
                <TrendingDown size={14} className="mr-2 text-destructive" /> Nova Saída
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated text-center gold-glow border-primary/30">
          <DollarSign size={16} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-primary">R$ {balance.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingUp size={16} className="mx-auto text-success mb-1" />
          <p className="text-lg font-bold text-success">R$ {totalIn.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Entradas</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingDown size={16} className="mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold text-destructive">R$ {totalOut.toFixed(2)}</p>
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
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum lançamento encontrado</p>
          )}
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
                {entry.type === "entrada" ? "+" : "-"}R$ {Number(entry.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para novo lançamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formType === "entrada" ? <TrendingUp size={18} className="text-success" /> : <TrendingDown size={18} className="text-destructive" />}
              {formType === "entrada" ? "Nova Entrada" : "Nova Saída"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Descrição *" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            <Input type="number" placeholder="Valor (R$) *" value={formAmount} onChange={e => setFormAmount(e.target.value)} min="0" step="0.01" />
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger><SelectValue placeholder="Categoria *" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            <Select value={formPlayerId} onValueChange={setFormPlayerId}>
              <SelectTrigger><SelectValue placeholder="Atleta (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {activePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={handleSubmit}
              disabled={addFinancial.isPending}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
            >
              {addFinancial.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;
