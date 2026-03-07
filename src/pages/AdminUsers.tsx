import { useAllProfiles, useAllRoles, approveUser, rejectUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Shield, User, ArrowLeft, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const { data: profiles = [], isLoading } = useAllProfiles();
  const { data: roles = [] } = useAllRoles();
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r?.role ?? "user";
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
      toast({ title: "Usuário aprovado!" });
    } catch {
      toast({ title: "Erro ao aprovar", variant: "destructive" });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectUser(userId);
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
      toast({ title: "Acesso revogado" });
    } catch {
      toast({ title: "Erro ao revogar", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Gerenciar Usuários</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {profiles.map((p: any) => {
            const role = getRoleForUser(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    {role === "admin" ? <Shield size={14} className="text-primary" /> : <User size={14} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.display_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{role === "admin" ? "Admin" : "Usuário"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {role !== "admin" && (
                    <>
                      {p.approved ? (
                        <Button size="sm" variant="outline" onClick={() => handleReject(p.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                          <XCircle size={14} className="mr-1" /> Revogar
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleApprove(p.id)} className="gap-1">
                          <CheckCircle2 size={14} /> Aprovar
                        </Button>
                      )}
                    </>
                  )}
                  {role === "admin" && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
