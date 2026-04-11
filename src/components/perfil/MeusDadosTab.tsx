import { useState } from "react";
import { Mail, Phone, User, Hash, Copy, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AlterarCelularDialog } from "@/components/perfil/AlterarCelularDialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/types/profile";
import type { User as SupaUser } from "@supabase/supabase-js";

interface MeusDadosTabProps {
  profile: Profile | null;
  user: SupaUser | null;
}

function CopyableRow({ icon: Icon, label, value, verified, isTechnical }: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  verified?: boolean;
  isTechnical?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className={`flex items-center gap-4 p-4 transition-colors ${isTechnical ? 'bg-muted/30' : 'hover:bg-muted/50'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isTechnical ? 'bg-muted' : 'bg-primary/10'}`}>
        <Icon className={`h-5 w-5 ${isTechnical ? 'text-muted-foreground' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-[15px] font-semibold truncate ${isTechnical ? 'font-mono text-xs text-muted-foreground' : 'text-foreground'}`}>
          {value || "Não informado"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {verified !== undefined && (
          <div className="flex items-center">
            {verified ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        )}
        {value && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCopy} 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
            title={`Copiar ${label}`}
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export function MeusDadosTab({ profile, user }: MeusDadosTabProps) {
  const queryClient = useQueryClient();

  const handleCelularSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    window.location.reload();
  };

  return (
    <div className="space-y-6 px-4 py-6 max-w-md mx-auto">
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Informações Pessoais</h2>
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-muted/30">
          <CopyableRow icon={User} label="Nome Completo" value={profile?.nome} />
          <CopyableRow icon={Mail} label="E-mail" value={user?.email || null} verified={true} />
          <CopyableRow icon={Phone} label="Telefone Celular" value={profile?.celular} verified={!!profile?.celular} />
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider text-[10px]">Identificação do Sistema</h2>
        <div className="rounded-xl border bg-card/50 overflow-hidden">
          <CopyableRow icon={Hash} label="ID do Usuário" value={user?.id || null} isTechnical={true} />
        </div>
      </div>

      {/* Alterar celular button */}
      <div className="pt-2">
        <AlterarCelularDialog
          celularAtual={profile?.celular || null}
          onSuccess={handleCelularSuccess}
          trigger={
            <Button variant="outline" className="w-full h-11 gap-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all">
              <Phone className="h-4 w-4" />
              {profile?.celular ? "Atualizar Celular" : "Vincular Celular"}
            </Button>
          }
        />
      </div>
    </div>
  );
}
