import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erro ao entrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">
            DU
          </div>
          <h1 className="text-xl font-bold text-foreground">Distrito União</h1>
          <p className="text-sm text-muted-foreground">Gestão de Elenco</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn size={16} className="mr-2" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline block">
            Esqueci minha senha
          </Link>
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
