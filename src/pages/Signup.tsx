import { useState } from "react";
import { Link } from "react-router-dom";
import { signUp } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle2 } from "lucide-react";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

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
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast({ title: "Telefone inválido", description: "Informe um número válido com DDD", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Verificar duplicatas via função segura
      const { data: check } = await supabase.rpc("check_duplicate_registration", {
        _cpf: cpfDigits,
        _phone: phoneDigits,
      });
      const result = check as any;
      if (result?.duplicate) {
        const fieldName = result.field === "cpf" ? "CPF" : "Telefone";
        toast({ title: `${fieldName} já cadastrado`, description: `Já existe uma conta com este ${fieldName}`, variant: "destructive" });
        setLoading(false);
        return;
      }

      await signUp(email, password, displayName, cpfDigits, birthDate, phoneDigits);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message?.includes("already registered")
        ? "Este email já está cadastrado"
        : err.message;
      toast({ title: "Erro ao cadastrar", description: msg, variant: "destructive" });
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
          <Input
            placeholder="Telefone (com DDD)"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
            inputMode="tel"
          />
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
