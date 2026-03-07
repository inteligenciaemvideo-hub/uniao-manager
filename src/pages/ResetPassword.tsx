import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada!" });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Nova senha</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="password" placeholder="Nova senha (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
