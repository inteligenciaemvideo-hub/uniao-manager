import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Phone, AlertCircle, Target, Handshake, SquareSlash, CircleX, MessageSquare, Receipt, Send, Plus, Upload, HeartCrack, UserX, UserCheck } from "lucide-react";
import { usePlayer, useUpdatePlayer, usePlayerComments, useAddComment, usePlayerFees, useAddFee, useMonthlyPayments, useEventAttendance, uploadPhoto } from "@/hooks/useSupabase";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { SatisfactionEmoji } from "@/lib/mockData";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const emojis: SatisfactionEmoji[] = ["😍", "😊", "😐", "😕", "😡"];

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: player, isLoading } = usePlayer(id);
  const updatePlayer = useUpdatePlayer();
  const { data: comments = [] } = usePlayerComments(id);
  const addComment = useAddComment();
  const { data: fees = [] } = usePlayerFees(id);
  const addFee = useAddFee();
  const { data: payments = [] } = useMonthlyPayments(id);

  const [newComment, setNewComment] = useState("");
  const [newFeeDesc, setNewFeeDesc] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [newFeeProof, setNewFeeProof] = useState<File | null>(null);
  const feeProofRef = useState<HTMLInputElement | null>(null);

  if (isLoading) return <div className="px-4 py-10 text-center text-muted-foreground">Carregando...</div>;
  if (!player) return <div className="px-4 py-10 text-center"><p className="text-muted-foreground">Atleta não encontrado</p></div>;

  const pendingMonths = payments.filter(p => !p.paid).length;
  const paymentMap: Record<string, boolean> = {};
  payments.forEach(p => { paymentMap[p.month] = p.paid; });

  const toggleInjured = async () => {
    await updatePlayer.mutateAsync({ id: player.id, injured: !player.injured });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment.mutateAsync({ player_id: player.id, text: newComment.trim(), date: new Date().toISOString().split("T")[0] });
    setNewComment("");
    toast.success("Comentário adicionado!");
  };

  const handleAddFee = async () => {
    if (!newFeeDesc.trim() || !newFeeAmount) return;
    await addFee.mutateAsync({ player_id: player.id, description: newFeeDesc.trim(), amount: parseFloat(newFeeAmount), paid: false, date: new Date().toISOString().split("T")[0] });
    setNewFeeDesc("");
    setNewFeeAmount("");
    toast.success("Taxa adicionada!");
  };

  const handleSatisfaction = async (emoji: SatisfactionEmoji) => {
    await updatePlayer.mutateAsync({ id: player.id, satisfaction: emoji });
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-bold">Perfil do Atleta</h2>
      </div>

      <div className="px-4 mb-4">
        <div className="card-elevated flex items-center gap-4">
          <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{player.name}</h3>
              {player.injured && <HeartCrack size={16} className="text-destructive" />}
            </div>
            <p className="text-sm text-muted-foreground">"{player.nickname}" · #{player.number}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {(player.positions || []).map(pos => <span key={pos} className="text-xs bg-secondary px-2 py-0.5 rounded">{pos}</span>)}
              <span className="text-xs text-muted-foreground">Pé {player.dominant_foot}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <button onClick={toggleInjured} className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${player.injured ? "bg-destructive/20 text-destructive border border-destructive/40" : "bg-secondary text-muted-foreground border border-border"}`}>
          <HeartCrack size={16} />
          {player.injured ? "Lesionado — Clique para retirar" : "Marcar como Lesionado"}
        </button>
      </div>

      <div className="px-4 mb-4">
        <div className="card-elevated">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Nível de Contentamento</h4>
          <div className="flex items-center justify-around">
            {emojis.map(emoji => (
              <button key={emoji} onClick={() => handleSatisfaction(emoji)} className={`text-3xl transition-all rounded-xl p-2 ${player.satisfaction === emoji ? "bg-primary/20 scale-125 ring-2 ring-primary" : "opacity-50 hover:opacity-80"}`}>{emoji}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="card-elevated text-center py-3"><Target size={14} className="mx-auto text-primary mb-1" /><p className="text-lg font-bold">{player.goals}</p><p className="text-[10px] text-muted-foreground">Gols</p></div>
          <div className="card-elevated text-center py-3"><Handshake size={14} className="mx-auto text-primary mb-1" /><p className="text-lg font-bold">{player.assists}</p><p className="text-[10px] text-muted-foreground">Assist.</p></div>
          <div className="card-elevated text-center py-3"><SquareSlash size={14} className="mx-auto text-warning mb-1" /><p className="text-lg font-bold">{player.yellow_cards}</p><p className="text-[10px] text-muted-foreground">Amarelos</p></div>
          <div className="card-elevated text-center py-3"><CircleX size={14} className="mx-auto text-destructive mb-1" /><p className="text-lg font-bold">{player.red_cards}</p><p className="text-[10px] text-muted-foreground">Vermelhos</p></div>
        </div>
      </div>

      {/* Comments */}
      <div className="px-4 mb-4">
        <div className="card-elevated">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><MessageSquare size={14} /> Comentários</h4>
          {comments.length > 0 ? (
            <div className="space-y-2 mb-3">
              {comments.map(c => (
                <div key={c.id} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm">{c.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.date).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground mb-3">Nenhum comentário ainda.</p>}
          <div className="flex gap-2">
            <Textarea placeholder="Adicionar comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="bg-secondary/30 border-border text-sm min-h-[40px] h-10 resize-none" />
            <button onClick={handleAddComment} className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0"><Send size={16} /></button>
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="px-4 mb-4">
        <div className="card-elevated">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Receipt size={14} /> Taxas & Multas</h4>
          {fees.length > 0 ? (
            <div className="space-y-2 mb-3">
              {fees.map(fee => (
                <div key={fee.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{fee.description}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(fee.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">R$ {Number(fee.amount)}</p>
                    <span className={`text-[10px] font-medium ${fee.paid ? "text-success" : "text-destructive"}`}>{fee.paid ? "Pago" : "Pendente"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground mb-3">Nenhuma taxa registrada.</p>}
          <div className="flex gap-2">
            <Input placeholder="Descrição da taxa" value={newFeeDesc} onChange={(e) => setNewFeeDesc(e.target.value)} className="bg-secondary/30 border-border text-sm" />
            <Input placeholder="R$" type="number" value={newFeeAmount} onChange={(e) => setNewFeeAmount(e.target.value)} className="bg-secondary/30 border-border text-sm w-20" />
            <button onClick={handleAddFee} className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0"><Plus size={16} /></button>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="px-4 mb-4">
        <div className="card-elevated space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contato</h4>
          <div className="flex items-center gap-3"><Phone size={14} className="text-muted-foreground" /><span className="text-sm">{player.phone || "—"}</span></div>
          <div className="flex items-center gap-3">
            <AlertCircle size={14} className="text-destructive" />
            <div>
              <p className="text-[10px] text-muted-foreground">Emergência</p>
              <span className="text-sm">{player.emergency_contact || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Payments */}
      <div className="px-4 mb-6">
        <div className="card-elevated">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Mensalidades · {pendingMonths > 0 ? <span className="text-destructive">{pendingMonths} pendentes</span> : <span className="text-success">Em dia</span>}
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {months.map(month => {
              const paid = paymentMap[month];
              return (
                <div key={month} className="text-center">
                  <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${paid === undefined ? "bg-muted text-muted-foreground" : paid ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                    {paid === undefined ? "—" : paid ? "✓" : "✗"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{month}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
