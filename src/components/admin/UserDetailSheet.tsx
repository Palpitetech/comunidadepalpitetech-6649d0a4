import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserDataTab } from "./UserDataTab";
import { UserPlanTab } from "./UserPlanTab";
import { UserPermissionsTab } from "./UserPermissionsTab";
import { UserModerationTab } from "./UserModerationTab";
import { User, CreditCard, Shield, Gavel } from "lucide-react";
import type { Plan, ExtendedProfile } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserDetailSheetProps {
  user: UserWithPlan | null;
  plans: Plan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserDetailSheet({
  user,
  plans,
  open,
  onOpenChange,
  onUserUpdated,
}: UserDetailSheetProps) {
  const isMobile = useIsMobile();

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[92dvh] rounded-t-2xl px-4 pt-3 pb-6 overflow-y-auto"
            : "w-full sm:max-w-lg overflow-y-auto p-6"
        }
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        <SheetHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 md:h-14 md:w-14">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-base md:text-lg">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-base md:text-lg truncate">
                {user.nome || "Sem nome"}
              </SheetTitle>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-[10px] md:text-xs">
                  {user.plan?.name || "Free"}
                </Badge>
                {user.is_blocked && (
                  <Badge variant="destructive" className="text-[10px] md:text-xs">Bloqueado</Badge>
                )}
                {user.status_assinatura === "ativa" && (
                  <Badge variant="outline" className="text-[10px] md:text-xs text-emerald-600 border-emerald-600">
                    Ativa
                  </Badge>
                )}
              </div>
              {user.email && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="dados" className="mt-2">
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="dados" className="text-xs gap-1 px-1">
              <User className="h-3.5 w-3.5 hidden md:inline" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="plano" className="text-xs gap-1 px-1">
              <CreditCard className="h-3.5 w-3.5 hidden md:inline" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="text-xs gap-1 px-1">
              <Shield className="h-3.5 w-3.5 hidden md:inline" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="moderacao" className="text-xs gap-1 px-1">
              <Gavel className="h-3.5 w-3.5 hidden md:inline" />
              Moderação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <UserDataTab user={user} onUserUpdated={onUserUpdated} />
          </TabsContent>

          <TabsContent value="plano" className="mt-4">
            <UserPlanTab user={user} plans={plans} onUserUpdated={onUserUpdated} />
          </TabsContent>

          <TabsContent value="permissoes" className="mt-4">
            <UserPermissionsTab user={user} onUserUpdated={onUserUpdated} />
          </TabsContent>

          <TabsContent value="moderacao" className="mt-4">
            <UserModerationTab user={user} onUserUpdated={onUserUpdated} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
