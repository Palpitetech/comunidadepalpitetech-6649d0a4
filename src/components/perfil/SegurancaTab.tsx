import { Button } from "@/components/ui/button";
import { Lock, LogOut, Shield, ChevronRight, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface SegurancaTabProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function SegurancaTab({ user, onSignOut }: SegurancaTabProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onSignOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        <Link to="/recuperar-senha" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Trocar Senha</p>
              <p className="text-[11px] text-muted-foreground">Altere sua senha de acesso</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link to="/privacidade" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Privacidade</p>
              <p className="text-[11px] text-muted-foreground">Política de privacidade</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <a href="https://chat.whatsapp.com/J89dx46Lo97G9YdAaGmR78" target="_blank" rel="noopener noreferrer" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Grupo WhatsApp</p>
              <p className="text-[11px] text-muted-foreground">Entre no nosso grupo</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </a>
      </div>

      <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
