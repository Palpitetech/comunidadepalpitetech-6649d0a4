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
      className={`group flex items-center gap-4 p-5 transition-all bg-background cursor-pointer active:bg-muted/30 border-b border-border/40 last:border-0 ${
        isTechnical ? 'opacity-70' : ''
      }`}
    >
      <div 
        className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform shadow-sm ${
          isTechnical ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className={`text-base font-bold truncate ${
          isTechnical ? 'font-mono text-xs text-muted-foreground' : 'text-foreground'
        }`}>
          {value || "Não informado"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {verified !== undefined && (
          <div className="flex items-center">
            {verified ? (
              <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100/50">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>VERIFICADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100/50">
                <AlertCircle className="h-2.5 w-2.5" />
                <span>PENDENTE</span>
              </div>
            )}
          </div>
        )}
        
        {action || (
          <div 
            className={`p-2 rounded-xl transition-all ${copied ? 'bg-primary/10' : 'bg-muted/10'}`}
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary animate-in zoom-in duration-300" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground/30" />
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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Seção de Perfil Principal */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-muted-foreground/50 px-1 uppercase tracking-[0.2em] flex items-center gap-2">
          Informações Pessoais
        </h3>
        <div className="rounded-[32px] border border-border/40 bg-background shadow-lg shadow-black/5 overflow-hidden ring-1 ring-black/5">
          <ProfileRow icon={User} label="Nome Completo" value={profile?.nome} />
          <ProfileRow icon={Mail} label="E-mail" value={user?.email || null} verified={true} />
          <ProfileRow 
            icon={Phone} 
            label="Telefone Celular" 
            value={formatarTelefone(profile?.celular || null)} 
            verified={!!profile?.celular} 
            action={
              <AlterarCelularDialog
                celularAtual={profile?.celular || null}
                onSuccess={handleCelularSuccess}
                trigger={
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
            }
          />
        </div>
      </div>

      {/* Seção Técnica */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-muted-foreground/50 px-1 uppercase tracking-[0.2em]">
          Identificação
        </h3>
        <div className="rounded-[24px] border border-border/40 bg-background/50 shadow-sm overflow-hidden">
          <ProfileRow icon={Hash} label="ID da Conta" value={user?.id || null} isTechnical={true} />
        </div>
      </div>

      {/* Dica de UX */}
      <div className="flex flex-col items-center gap-2 px-4 py-6 rounded-3xl bg-muted/20 border border-border/20">
        <p className="text-center text-[12px] text-muted-foreground font-semibold">
          Dica rápida
        </p>
        <p className="text-center text-[11px] text-muted-foreground/70 font-medium">
          Toque em qualquer campo acima para copiar os dados para sua área de transferência.
        </p>
      </div>
    </div>
  );
}
