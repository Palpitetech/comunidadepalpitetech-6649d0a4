import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, Sparkles, Calendar, Copy, Check } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMySubscription } from "@/hooks/useMySubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { STATUS_CONFIG } from "@/lib/subscription";
import { differenceInDays, format } from "date-fns";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";

interface PerfilHeroProps {
  profile: Profile | null;
  user: User | null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
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
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      title={`Copiar ${label}`}
    >
      <span className="truncate max-w-[200px]">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

export function PerfilHero({ profile, user }: PerfilHeroProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);

  const statusConfig = STATUS_CONFIG[(subscription?.status ?? "inativa")];
  const diasRestantes = subscription?.validade
    ? differenceInDays(new Date(subscription.validade), new Date())
    : null;

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo de 5MB permitido.");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("perfis").update({ avatar_url: avatarUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {getInitials(profile?.nome)}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow border-2 border-background hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {/* Nome */}
      <h2 className="text-lg font-bold text-foreground">{profile?.nome || "Usuário"}</h2>

      {/* Email copiável */}
      {user?.email && <CopyField label="Email" value={user.email} />}

      {/* ID da conta copiável */}
      {user?.id && (
        <CopyField label="ID da conta" value={user.id} />
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mt-1">
        <Badge
          variant={isPremium ? "default" : "secondary"}
          className={`text-xs ${isPremium ? "bg-primary hover:bg-primary/90" : ""}`}
        >
          {isPremium ? (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </>
          ) : (
            "Grátis"
          )}
        </Badge>
        <Badge variant={statusConfig.variant} className="text-xs">
          {statusConfig.label}
        </Badge>
        {diasRestantes !== null && (
          <Badge
            variant={diasRestantes > 7 ? "outline" : diasRestantes > 0 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {diasRestantes > 0 ? `${diasRestantes}d` : diasRestantes === 0 ? "Hoje" : "Expirou"}
          </Badge>
        )}
      </div>

      {/* Vencimento */}
      {subscription?.validade && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Vence em {format(new Date(subscription.validade), "dd/MM/yyyy")}</span>
        </div>
      )}
    </div>
  );
}
