import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";

interface PerfilDadosHeroProps {
  profile: Profile | null;
  user: User | null;
}

export function PerfilDadosHero({ profile, user }: PerfilDadosHeroProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "MMM yyyy", { locale: ptBR })
    : null;

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
    setIsUploading(true);
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
      const { error: updateError } = await supabase
        .from("perfis")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 px-4 pt-6 pb-4">
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {getInitials(profile?.nome)}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Trocar foto"
          className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow border-2 border-background hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      <h2 className="text-xl font-bold text-foreground mt-1 text-center px-4">
        {profile?.nome || "Usuário"}
      </h2>
      {memberSince && (
        <p className="text-xs text-muted-foreground">
          Membro desde {memberSince}
        </p>
      )}
    </div>
  );
}
