import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { useAddPlayer, uploadPhoto } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const allPositions = ["Goleiro", "Zagueiro", "Lateral", "Meio-campo", "Atacante"];

const AddPlayer = () => {
  const navigate = useNavigate();
  const addPlayer = useAddPlayer();
  const photoRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [number, setNumber] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [dominantFoot, setDominantFoot] = useState<string>("Direito");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const togglePosition = (pos: string) => {
    setPositions(prev => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !nickname.trim() || !number || positions.length === 0) return;
    setSaving(true);

    try {
      let photo_url = "";
      if (photoFile) {
        const path = `players/${Date.now()}-${photoFile.name}`;
        photo_url = await uploadPhoto("photos", path, photoFile);
      }

      await addPlayer.mutateAsync({
        name: name.trim(),
        nickname: nickname.trim(),
        positions,
        number: parseInt(number),
        photo_url,
        dominant_foot: dominantFoot,
        birth_date: birthDate,
        phone: phone.trim(),
        emergency_contact: emergencyContact.trim(),
      });

      toast.success("Atleta criado com sucesso!");
      navigate("/elenco");
    } catch (err) {
      toast.error("Erro ao salvar atleta");
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
        <h2 className="text-lg font-bold">Novo Atleta</h2>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex justify-center">
          <button onClick={() => photoRef.current?.click()} className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors">
            {photoPreview ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" /> : <Upload size={24} className="text-muted-foreground" />}
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="card-elevated space-y-3">
          <Input placeholder="Nome completo *" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/30 border-border" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Apelido *" value={nickname} onChange={e => setNickname(e.target.value)} className="bg-secondary/30 border-border" />
            <Input placeholder="Número *" type="number" value={number} onChange={e => setNumber(e.target.value)} className="bg-secondary/30 border-border" />
          </div>
        </div>

        <div className="card-elevated">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Posições *</h4>
          <div className="space-y-2">
            {allPositions.map(pos => (
              <label key={pos} className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={positions.includes(pos)} onCheckedChange={() => togglePosition(pos)} />
                <span className="text-sm">{pos}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card-elevated space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pé dominante</label>
            <Select value={dominantFoot} onValueChange={setDominantFoot}>
              <SelectTrigger className="bg-secondary/30 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Direito">Direito</SelectItem>
                <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Data de nascimento" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="bg-secondary/30 border-border" />
          <Input placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary/30 border-border" />
          <Input placeholder="Contato de emergência" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="bg-secondary/30 border-border" />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <button onClick={handleSave} disabled={!name.trim() || !nickname.trim() || !number || positions.length === 0 || saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar Atleta"}
        </button>
      </div>
    </div>
  );
};

export default AddPlayer;
