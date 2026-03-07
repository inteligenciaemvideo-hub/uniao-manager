import { useState } from "react";
import { Link } from "react-router-dom";
import { signUp } from "@/hooks/useAuth";
import { uploadPhoto } from "@/hooks/useSupabase";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle2, Camera, Upload } from "lucide-react";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF inválido", description: "Informe os 11 dígitos do CPF", variant: "destructive" });
      return;
    }
    if (!birthDate) {
      toast({ title: "Data de nascimento obrigatória", variant: "destructive" });
      return;
    }
    if (!docFile) {
      toast({ title: "Documento obrigatório", description: "Anexe uma foto do documento com foto", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Sign up first
      const result = await signUp(email, password, displayName, cpfDigits, birthDate);
      const userId = result.user?.id;

      // Upload document photo
      if (userId && docFile) {
        const ext = docFile.name.split(".").pop();
        const path = `docs/${userId}/${Date.now()}.${ext}`;
        const docUrl = await uploadPhoto("documents", path, docFile);
        
        // Update profile with document URL (need to wait for trigger to create profile)
        // We'll retry a few times since the trigger runs async
        let retries = 3;
        while (retries > 0) {
          const { error } = await supabase
            .from("profiles")
            .update({ document_url: docUrl })
            .eq("id", userId);
          if (!error) break;
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1000));
        }
      }

      setSuccess(true);
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-[hsl(var(--success))]" />
          <h1 className="text-xl font-bold text-foreground">Cadastro realizado!</h1>
          <p className="text-sm text-muted-foreground">
            Verifique seu email para confirmar a conta. Após confirmar, um administrador precisará aprovar seu acesso.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4">Voltar ao login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Criar Conta</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nome completo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            required
            inputMode="numeric"
          />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data de Nascimento</label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          {/* Document upload */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Documento com foto (RG, CNH, etc)</label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
              {docPreview ? (
                <img src={docPreview} alt="Documento" className="max-h-40 rounded object-contain" />
              ) : (
                <>
                  <div className="flex gap-2 text-muted-foreground">
                    <Camera size={20} />
                    <Upload size={20} />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">
                    Tire uma foto ou anexe o documento
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleDocChange}
              />
              {docFile && (
                <span className="text-xs text-primary">{docFile.name}</span>
              )}
            </label>
          </div>

          <Input
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus size={16} className="mr-2" />
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
