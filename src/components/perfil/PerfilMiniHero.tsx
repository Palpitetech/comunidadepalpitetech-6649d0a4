import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";

interface PerfilMiniHeroProps {
  profile: Profile | null;
  user: User | null;
}

export function PerfilMiniHero({ profile }: PerfilMiniHeroProps) {
  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isPremium = profile?.status_assinatura === "ativa";
  const trialUsed = profile?.trial_used;

  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b">
      <Avatar className="h-14 w-14 border border-border shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
          {getInitials(profile?.nome)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate">
          {profile?.nome || "Usuário"}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isPremium ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
              Premium
            </Badge>
          ) : trialUsed ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap">
              Teste Vencido
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/20">
              Plano Free
            </Badge>
          )}
          <span className="text-xs text-muted-foreground truncate">
            {profile?.celular || "Sem celular"}
          </span>
        </div>
      </div>
    </div>
  );
}
