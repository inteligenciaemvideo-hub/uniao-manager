import { useState, useRef } from "react";
import { Plus, X, Phone, Mail, Calendar, DollarSign, Package, FileText, Image as ImageIcon, ChevronDown, ChevronUp, Edit2, Trash2, Check } from "lucide-react";
import { useSponsors, useAddSponsor, useUpdateSponsor, useDeleteSponsor, uploadPhoto } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Sponsors = () => {
  const { data: sponsors = [] } = useSponsors();
  const addSponsor = useAddSponsor();
  const updateSponsor = useUpdateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    divulgation_date: "",
    payment_date: "",
    amount: 0,
    item_description: "",
    payment_type: "dinheiro" as string,
    notes: "",
  });

  const resetForm = () => {
    setForm({
      name: "", contact_name: "", contact_phone: "", contact_email: "",
      divulgation_date: "", payment_date: "", amount: 0, item_description: "",
      payment_type: "dinheiro", notes: "",
    });
    setLogoPreview(null);
    setLogoFile(null);
    setEditingId(null);
  };

  const openEdit = (sponsor: any) => {
    setForm({
      name: sponsor.name || "",
      contact_name: sponsor.contact_name || "",
      contact_phone: sponsor.contact_phone || "",
      contact_email: sponsor.contact_email || "",
      divulgation_date: sponsor.divulgation_date || "",
      payment_date: sponsor.payment_date || "",
      amount: sponsor.amount || 0,
      item_description: sponsor.item_description || "",
      payment_type: sponsor.payment_type || "dinheiro",
      notes: sponsor.notes || "",
    });
    setLogoPreview(sponsor.logo_url || null);
    setLogoFile(null);
    setEditingId(sponsor.id);
    setShowForm(true);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome do patrocinador é obrigatório");
      return;
    }

    try {
      let logo_url = logoPreview;
      if (logoFile) {
        const path = `sponsors/${Date.now()}-${logoFile.name}`;
        logo_url = await uploadPhoto("photos", path, logoFile);
      }

      const payload = { ...form, logo_url };

      if (editingId) {
        await updateSponsor.mutateAsync({ id: editingId, ...payload });
        toast.success("Patrocinador atualizado!");
      } else {
        await addSponsor.mutateAsync(payload);
        toast.success("Patrocinador cadastrado!");
      }

      resetForm();
      setShowForm(false);
    } catch {
      toast.error("Erro ao salvar patrocinador");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este patrocinador?")) return;
    await deleteSponsor.mutateAsync(id);
    toast.success("Patrocinador removido");
  };

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const activeSponsors = sponsors.filter((s: any) => s.active !== false);
  const inactiveSponsors = sponsors.filter((s: any) => s.active === false);

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Patrocínios</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated text-center py-3">
          <p className="text-lg font-bold">{activeSponsors.length}</p>
          <p className="text-[10px] text-muted-foreground">Ativos</p>
        </div>
        <div className="card-elevated text-center py-3">
          <p className="text-lg font-bold text-primary">
            R$ {activeSponsors.reduce((s: number, sp: any) => s + (sp.amount || 0), 0).toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">Total em patrocínio</p>
        </div>
      </div>

      {/* Sponsor cards */}
      {activeSponsors.length === 0 && inactiveSponsors.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhum patrocinador cadastrado ainda.
        </div>
      )}

      {activeSponsors.map((sponsor: any) => (
        <div key={sponsor.id} className="card-elevated">
          <button onClick={() => toggle(sponsor.id)} className="w-full flex items-center gap-3">
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 rounded-lg object-contain bg-secondary p-1 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <ImageIcon size={18} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold truncate">{sponsor.name}</p>
              {sponsor.contact_name && (
                <p className="text-[10px] text-muted-foreground truncate">{sponsor.contact_name}</p>
              )}
              {sponsor.amount > 0 && (
                <p className="text-[10px] text-primary font-semibold">R$ {Number(sponsor.amount).toFixed(2)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(sponsor); }}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
              >
                <Edit2 size={12} />
              </button>
              {expanded[sponsor.id] ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </div>
          </button>

          {expanded[sponsor.id] && (
            <div className="mt-4 pt-3 border-t border-border space-y-3">
              {sponsor.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <a href={`tel:${sponsor.contact_phone}`} className="text-primary">{sponsor.contact_phone}</a>
                </div>
              )}
              {sponsor.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <a href={`mailto:${sponsor.contact_email}`} className="text-primary">{sponsor.contact_email}</a>
                </div>
              )}
              {sponsor.divulgation_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Divulgação:</span>
                  <span>{sponsor.divulgation_date}</span>
                </div>
              )}
              {sponsor.payment_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Recebimento:</span>
                  <span>{sponsor.payment_date}</span>
                </div>
              )}
              {sponsor.amount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-primary shrink-0" />
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-primary">R$ {Number(sponsor.amount).toFixed(2)}</span>
                </div>
              )}
              {sponsor.item_description && (
                <div className="flex items-center gap-2 text-sm">
                  <Package size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Item:</span>
                  <span>{sponsor.item_description}</span>
                </div>
              )}
              {sponsor.payment_type && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="capitalize">{sponsor.payment_type}</span>
                </div>
              )}
              {sponsor.notes && (
                <div className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
                  {sponsor.notes}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    await updateSponsor.mutateAsync({ id: sponsor.id, active: false });
                    toast.success("Patrocinador desativado");
                  }}
                  className="flex-1 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/30"
                >
                  Desativar
                </button>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/30"
                >
                  <Trash2 size={12} className="inline mr-1" /> Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Inactive sponsors */}
      {inactiveSponsors.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Inativos ({inactiveSponsors.length})</h3>
          {inactiveSponsors.map((sponsor: any) => (
            <div key={sponsor.id} className="card-elevated opacity-60 mb-3">
              <div className="flex items-center gap-3">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="w-10 h-10 rounded-lg object-contain bg-secondary p-1 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <ImageIcon size={14} className="text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium flex-1">{sponsor.name}</span>
                <button
                  onClick={async () => {
                    await updateSponsor.mutateAsync({ id: sponsor.id, active: true });
                    toast.success("Patrocinador reativado");
                  }}
                  className="text-xs text-primary font-semibold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30"
                >
                  Reativar
                </button>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center"
                >
                  <Trash2 size={12} className="text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="w-full bg-card rounded-t-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold">{editingId ? "Editar Patrocinador" : "Novo Patrocinador"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
              {/* Logo upload */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Logo do patrocinador</label>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full h-24 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center gap-2 overflow-hidden hover:border-primary/40 transition-colors"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-20 w-20 object-contain" />
                  ) : (
                    <><ImageIcon size={20} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Anexar logo</span></>
                  )}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Nome do patrocinador *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Empresa XYZ"
                  className="bg-secondary/30 border-border"
                />
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Nome do contato</label>
                  <Input
                    value={form.contact_name}
                    onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Responsável"
                    className="bg-secondary/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Telefone</label>
                  <Input
                    value={form.contact_phone}
                    onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="bg-secondary/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">E-mail</label>
                  <Input
                    value={form.contact_email}
                    onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    type="email"
                    className="bg-secondary/30 border-border"
                  />
                </div>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Dia de divulgação</label>
                  <Input
                    value={form.divulgation_date}
                    onChange={e => setForm(f => ({ ...f, divulgation_date: e.target.value }))}
                    placeholder="Ex: Todo dia 15"
                    className="bg-secondary/30 border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Dia de recebimento</label>
                  <Input
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    placeholder="Ex: Todo dia 5"
                    className="bg-secondary/30 border-border"
                  />
                </div>
              </div>

              {/* Payment */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de patrocínio</label>
                <div className="flex gap-2">
                  {["dinheiro", "item", "ambos"].map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, payment_type: t }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
                        form.payment_type === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t === "dinheiro" ? "💰 Dinheiro" : t === "item" ? "📦 Item" : "💰📦 Ambos"}
                    </button>
                  ))}
                </div>
              </div>

              {(form.payment_type === "dinheiro" || form.payment_type === "ambos") && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    placeholder="0.00"
                    className="bg-secondary/30 border-border"
                  />
                </div>
              )}

              {(form.payment_type === "item" || form.payment_type === "ambos") && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Descrição do item</label>
                  <Input
                    value={form.item_description}
                    onChange={e => setForm(f => ({ ...f, item_description: e.target.value }))}
                    placeholder="Ex: 20 camisas personalizadas"
                    className="bg-secondary/30 border-border"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Anotações sobre o patrocínio..."
                  rows={3}
                  className="w-full rounded-lg bg-secondary/30 border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border bg-card shrink-0 space-y-3">
              <button
                onClick={handleSave}
                disabled={addSponsor.isPending || updateSponsor.isPending}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Check size={16} /> {editingId ? "Salvar Alterações" : "Cadastrar Patrocinador"}
              </button>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="w-full py-2.5 text-muted-foreground text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sponsors;
