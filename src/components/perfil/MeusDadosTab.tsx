import { useState } from "react";
import { Mail, Phone, User, Hash, Copy, Check, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
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

function CopyableRow({ icon: Icon, label, value, verified, isTechnical, action }: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  verified?: boolean;
  isTechnical?: boolean;
  action?: React.ReactNode;
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
    <div 
      className={`group flex items-center gap-4 p-4 transition-all ${
        isTechnical ? 'bg-muted/20' : 'hover:bg-muted/40'
      }`}
    >
      <div 
        onClick={handleCopy}
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 cursor-pointer ${
          isTechnical ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      
      <div 
        onClick={handleCopy}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className={`text-base font-semibold truncate ${
          isTechnical ? 'font-mono text-xs text-muted-foreground' : 'text-foreground'
        }`}>
          {value || "Não informado"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {verified !== undefined && (
          <div className="flex items-center">
            {verified ? (
              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>VERIFICADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                <AlertCircle className="h-2.5 w-2.5" />
                <span>PENDENTE</span>
              </div>
            )}
          </div>
        )}
        
        {action || (
          <div 
            onClick={handleCopy}
            className={`p-2 rounded-full transition-colors cursor-pointer ${copied ? 'bg-primary/10' : 'bg-transparent group-hover:bg-primary/5'}`}
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary animate-in zoom-in duration-300" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            )}
          </div>
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
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Seção de Perfil Principal */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xs font-bold text-muted-foreground/80 px-1 uppercase tracking-widest">
            Informações Pessoais
          </h2>
          <div className="rounded-3xl border bg-card shadow-sm overflow-hidden divide-y divide-muted/30">
            <CopyableRow icon={User} label="Nome Completo" value={profile?.nome} />
            <CopyableRow icon={Mail} label="E-mail" value={user?.email || null} verified={true} />
            <CopyableRow icon={Phone} label="Telefone Celular" value={profile?.celular} verified={!!profile?.celular} />
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <AlterarCelularDialog
          celularAtual={profile?.celular || null}
          onSuccess={handleCelularSuccess}
          trigger={
            <Button 
              variant="outline" 
              className="w-full h-12 gap-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-[0.98]"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
              </div>
              {profile?.celular ? "Atualizar Celular" : "Vincular Celular"}
            </Button>
          }
        />
      </div>

      {/* Seção Técnica */}
      <div className="space-y-2">
        <h2 className="text-[10px] font-bold text-muted-foreground/60 px-1 uppercase tracking-[0.2em]">
          Identificação da Conta
        </h2>
        <div className="rounded-2xl border bg-muted/10 overflow-hidden">
          <CopyableRow icon={Hash} label="ID de Usuário" value={user?.id || null} isTechnical={true} />
        </div>
      </div>

      {/* Dica de UX */}
      <p className="text-center text-[11px] text-muted-foreground/50 font-medium italic">
        Toque em qualquer campo para copiar as informações
      </p>
    </div>
  );
}
