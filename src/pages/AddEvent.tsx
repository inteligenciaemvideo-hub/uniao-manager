import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { useAddEvent, uploadPhoto } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const AddEvent = () => {
  const navigate = useNavigate();
  const addEvent = useAddEvent();
  const logoRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<string>("Treino");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!date || !time || !location.trim()) return;
    setSaving(true);

    try {
      let opponent_logo_url: string | undefined;
      if (logoFile) {
        const path = `opponents/${Date.now()}-${logoFile.name}`;
        opponent_logo_url = await uploadPhoto("photos", path, logoFile);
      }

      await addEvent.mutateAsync({
        type,
        date,
        time,
        location: location.trim(),
        opponent: opponent.trim() || undefined,
        opponent_logo_url,
      });

      toast.success("Compromisso criado com sucesso!");
      navigate("/compromissos");
    } catch (err) {
      toast.error("Erro ao salvar compromisso");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold">Novo Compromisso</h2>
      </div>

      <div className="px-4 space-y-4">
        <div className="card-elevated space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tipo *</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Treino">Treino</SelectItem>
                <SelectItem value="Amistoso">Amistoso</SelectItem>
                <SelectItem value="Torneio">Torneio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary/30 border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Horário *</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-secondary/30 border-border" />
            </div>
          </div>

          <Input placeholder="Local *" value={location} onChange={e => setLocation(e.target.value)} className="bg-secondary/30 border-border" />
        </div>

        {(type === "Amistoso" || type === "Torneio") && (
          <div className="card-elevated space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adversário</h4>
            <Input placeholder="Nome do adversário" value={opponent} onChange={e => setOpponent(e.target.value)} className="bg-secondary/30 border-border" />
            <div className="flex items-center gap-4">
              <button onClick={() => logoRef.current?.click()} className="w-16 h-16 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors">
                {logoPreview ? <img src={logoPreview} alt="Logo adversário" className="w-full h-full object-cover" /> : <Upload size={20} className="text-muted-foreground" />}
              </button>
              <p className="text-xs text-muted-foreground">Logo do adversário (opcional)</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <button onClick={handleSave} disabled={!date || !time || !location.trim() || saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {saving ? "Salvando..." : "Criar Compromisso"}
        </button>
      </div>
    </div>
  );
};

export default AddEvent;
