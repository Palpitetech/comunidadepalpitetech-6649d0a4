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

function ProfileRow({ icon: Icon, label, value, verified, isTechnical, action }: {
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
      onClick={handleCopy}
      className={`group flex items-center gap-5 p-6 transition-all bg-card cursor-pointer active:bg-muted/40 border-b border-border last:border-0 ${
        isTechnical ? 'bg-muted/5' : ''
      }`}
    >
      <div 
        className={`h-14 w-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-sm border-2 ${
          isTechnical 
          ? 'bg-muted text-muted-foreground border-transparent' 
          : 'bg-primary/5 text-primary border-primary/20'
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] mb-1">
          {label}
        </p>
        <p className={`text-lg font-black truncate leading-tight ${
          isTechnical ? 'font-mono text-sm text-muted-foreground' : 'text-foreground'
        }`}>
          {value || "Não informado"}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-1">
        {verified !== undefined && (
          <div className="flex items-center">
            {verified ? (
              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
                <span>VERIFICADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                <AlertCircle className="h-3 w-3" />
                <span>PENDENTE</span>
              </div>
            )}
          </div>
        )}
        
        {action || (
          <div 
            className={`p-3 rounded-2xl transition-all shadow-sm border ${
              copied ? 'bg-primary/10 border-primary/30' : 'bg-muted/10 border-transparent'
            }`}
          >
            {copied ? (
              <Check className="h-5 w-5 text-primary animate-in zoom-in duration-300" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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

  const formatarTelefone = (tel: string | null) => {
    if (!tel) return tel;
    const digits = tel.replace(/\D/g, "");
    if (digits.length === 13) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return tel;
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Seção Principal */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-muted-foreground px-1 uppercase tracking-[0.25em] flex items-center gap-3">
          <span className="h-[2px] w-4 bg-primary/30 rounded-full" />
          Informações Pessoais
        </h3>
        <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-black/5">
          <ProfileRow icon={User} label="Nome Completo" value={profile?.nome} />
          <ProfileRow icon={Mail} label="E-mail de Acesso" value={user?.email || null} verified={true} />
          <ProfileRow 
            icon={Phone} 
            label="Telefone WhatsApp" 
            value={formatarTelefone(profile?.celular || null)} 
            verified={!!profile?.celular} 
            action={
              <AlterarCelularDialog
                celularAtual={profile?.celular || null}
                onSuccess={handleCelularSuccess}
                trigger={
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl bg-secondary hover:bg-primary/10 hover:text-primary transition-all active:scale-95 border-2 border-border/50 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                }
              />
            }
          />
        </div>
      </div>

      {/* Seção ID */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-muted-foreground px-1 uppercase tracking-[0.25em] flex items-center gap-3">
          <span className="h-[2px] w-4 bg-muted-foreground/30 rounded-full" />
          Identificação da Conta
        </h3>
        <div className="rounded-[2.5rem] border border-border bg-card/60 shadow-xl shadow-black/5 overflow-hidden">
          <ProfileRow icon={Hash} label="ID do Usuário" value={user?.id || null} isTechnical={true} />
        </div>
      </div>

      {/* Dica de UX */}
      <div className="flex flex-col items-center gap-4 px-8 py-10 rounded-[3rem] bg-primary/5 border-2 border-primary/10 border-dashed">
        <p className="text-center text-sm text-primary font-black uppercase tracking-wider">
          Instrução de Cópia
        </p>
        <p className="text-center text-sm text-muted-foreground font-bold leading-relaxed">
          Para copiar qualquer dado acima para seu WhatsApp ou outro app, basta tocar no campo desejado.
        </p>
      </div>
    </div>
  );
}
