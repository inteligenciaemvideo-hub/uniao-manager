import { signOut } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

const PendingApproval = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <Clock size={48} className="mx-auto text-primary" />
        <h1 className="text-xl font-bold text-foreground">Aguardando aprovação</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta foi criada, mas ainda precisa ser aprovada por um administrador. Tente novamente mais tarde.
        </p>
        <Button variant="outline" onClick={() => signOut()} className="gap-2">
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
