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

function CopyableRow({ icon: Icon, label, value, verified }: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  verified?: boolean;
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
    <div className="flex items-center gap-3 p-3.5">
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "Não informado"}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {verified !== undefined && (
          verified ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          )
        )}
        {value && (
          <button onClick={handleCopy} className="p-1 hover:bg-muted rounded transition-colors" title={`Copiar ${label}`}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
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
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        <CopyableRow icon={User} label="Nome" value={profile?.nome} />
        <CopyableRow icon={Mail} label="E-mail" value={user?.email || null} verified={true} />
        <CopyableRow icon={Phone} label="Celular" value={profile?.celular} verified={!!profile?.celular} />
        <CopyableRow icon={Hash} label="ID da Conta (imutável)" value={user?.id || null} />
      </div>

      {/* Alterar celular */}
      <AlterarCelularDialog
        celularAtual={profile?.celular || null}
        onSuccess={handleCelularSuccess}
        trigger={
          <Button variant="outline" className="w-full gap-2">
            <Phone className="h-4 w-4" />
            {profile?.celular ? "Alterar Celular" : "Adicionar Celular"}
          </Button>
        }
      />
    </div>
  );
}
