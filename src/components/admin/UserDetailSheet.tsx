import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserDataTab } from "./UserDataTab";
import { UserPlanTab } from "./UserPlanTab";
import { UserPermissionsTab } from "./UserPermissionsTab";
import { UserModerationTab } from "./UserModerationTab";
import type { Plan, ExtendedProfile, PlanFeatures } from "@/types/plans";

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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto h-[100dvh] md:h-auto p-4 md:p-6">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">{user.nome || "Sem nome"}</SheetTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{user.plan?.name || "Sem plano"}</Badge>
                {user.is_blocked && <Badge variant="destructive">Bloqueado</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="dados" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="plano" className="text-xs">Plano</TabsTrigger>
            <TabsTrigger value="permissoes" className="text-xs">Permissões</TabsTrigger>
            <TabsTrigger value="moderacao" className="text-xs">Moderação</TabsTrigger>
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
