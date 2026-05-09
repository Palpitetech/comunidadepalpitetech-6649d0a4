import { useState, useRef, ReactNode } from "react";
import { Mail, Phone, User, Hash, Copy, Check, CheckCircle2, AlertCircle, Pencil, ChevronRight, Lock, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AlterarCelularDialog } from "@/components/perfil/AlterarCelularDialog";
import { EditarNomeDrawer } from "@/components/perfil/EditarNomeDrawer";
import { TrocarSenhaDialog } from "@/components/perfil/TrocarSenhaDialog";
import { useQueryClient } from "@tanstack/react-query";
import { formatCelularMask } from "@/lib/celular";
import type { Profile } from "@/types/profile";
import type { User as SupaUser } from "@supabase/supabase-js";

interface MeusDadosTabProps {
  profile: Profile | null;
  user: SupaUser | null;
}

interface DataRowProps {
  icon: LucideIcon;
  iconBg?: string;
  label: string;
  value: string | null;
  displayValue?: string;
  verified?: boolean;
  verifiedHint?: string;
  unverifiedHint?: string;
  action?: ReactNode;
  onTap?: () => void;
  copyable?: boolean;
  copyValue?: string;
}

function vibrate(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* noop */
  }
}

function DataRow({
  icon: Icon,
  iconBg = "bg-primary/10 text-primary",
  label,
  value,
  displayValue,
  verified,
  verifiedHint,
  unverifiedHint,
  action,
  onTap,
  copyable = true,
  copyValue,
}: DataRowProps) {
  const [copied, setCopied] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const doCopy = async () => {
    const v = copyValue ?? value;
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      setCopied(true);
      vibrate(20);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (onTap) {
      onTap();
    } else if (copyable) {
      doCopy();
    }
  };

  const handlePressStart = () => {
    if (!copyable) return;
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      doCopy();
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      className="w-full flex items-center gap-3 px-4 min-h-[64px] py-3 text-left active:bg-muted/60 transition-colors"
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          {verified !== undefined && (
            verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {verifiedHint || "verificado"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-500">
                <AlertCircle className="h-3 w-3" />
                {unverifiedHint || "não verificado"}
              </span>
            )
          )}
        </div>
        <p className="text-base font-semibold text-foreground truncate">
          {displayValue ?? value ?? "Não informado"}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
        {action}
        {!action && copyable && value && (
          copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4 opacity-60" />
          )
        )}
      </div>
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-1 mb-2">
      {children}
    </p>
  );
}

export function MeusDadosTab({ profile, user }: MeusDadosTabProps) {
  const queryClient = useQueryClient();
  const [editNomeOpen, setEditNomeOpen] = useState(false);
  const [celularOpen, setCelularOpen] = useState(false);
  const [trocarSenhaOpen, setTrocarSenhaOpen] = useState(false);

  const handleCelularSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const celularRaw = profile?.celular || null;
  const celularDisplay = celularRaw
    ? formatCelularMask(celularRaw.replace(/^55/, ""))
    : null;

  const idShort = user?.id ? `${user.id.slice(0, 8)}…${user.id.slice(-4)}` : null;

  return (
    <div className="px-4 py-2 space-y-6">
      {/* Dados de Contato */}
      <section>
        <SectionLabel>Dados de Contato</SectionLabel>
        <div className="rounded-2xl border bg-card overflow-hidden divide-y">
          <DataRow
            icon={User}
            label="Nome completo"
            value={profile?.nome || null}
            copyable={false}
            onTap={() => setEditNomeOpen(true)}
            action={<Pencil className="h-4 w-4" />}
          />
          <DataRow
            icon={Mail}
            iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            label="E-mail"
            value={user?.email || null}
            verified
            verifiedHint="verificado"
          />
          <DataRow
            icon={Phone}
            iconBg="bg-green-500/10 text-green-600 dark:text-green-400"
            label="Celular / WhatsApp"
            value={celularRaw}
            displayValue={celularDisplay || "Não informado"}
            verified={!!profile?.celular_verificado}
            verifiedHint="verificado"
            unverifiedHint="não verificado"
            copyable={!!celularDisplay}
            copyValue={celularDisplay || undefined}
            onTap={celularRaw ? undefined : () => setCelularOpen(true)}
            action={
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setCelularOpen(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline px-1.5 py-1 rounded"
              >
                {celularRaw ? "Alterar" : "Adicionar"}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            }
          />
        </div>
      </section>

      {/* Identificação */}
      <section>
        <SectionLabel>Identificação</SectionLabel>
        <div className="rounded-2xl border bg-card overflow-hidden divide-y">
          <DataRow
            icon={Hash}
            iconBg="bg-muted text-muted-foreground"
            label="ID da Conta (toque para copiar)"
            value={user?.id || null}
            displayValue={idShort || "—"}
            copyValue={user?.id || undefined}
          />
        </div>
      </section>

      {/* Drawers */}
      <EditarNomeDrawer
        open={editNomeOpen}
        onOpenChange={setEditNomeOpen}
        nomeAtual={profile?.nome || null}
      />
      <AlterarCelularDialog
        celularAtual={profile?.celular || null}
        onSuccess={handleCelularSuccess}
        open={celularOpen}
        onOpenChange={setCelularOpen}
      />
    </div>
  );
}
