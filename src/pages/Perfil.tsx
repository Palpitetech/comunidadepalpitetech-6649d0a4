import { useAuthContext } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerfilHero } from "@/components/perfil/PerfilHero";
import { MeusDadosTab } from "@/components/perfil/MeusDadosTab";
import { TransacoesTab } from "@/components/perfil/TransacoesTab";
import { AssinaturaTab } from "@/components/perfil/AssinaturaTab";
import { SegurancaTab } from "@/components/perfil/SegurancaTab";

export default function Perfil() {
  const { profile, user, signOut } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header fixo */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Meu Perfil</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <ScrollArea className="flex-1">
        <div className="pb-8 max-w-lg mx-auto w-full">
          <PerfilHero profile={profile} user={user} />

          <Tabs defaultValue="dados" className="w-full">
            <div className="px-4">
              <TabsList className="w-full grid grid-cols-4 h-10">
                <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
                <TabsTrigger value="transacoes" className="text-xs">Transações</TabsTrigger>
                <TabsTrigger value="assinatura" className="text-xs">Assinatura</TabsTrigger>
                <TabsTrigger value="seguranca" className="text-xs">Segurança</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dados">
              <MeusDadosTab profile={profile} user={user} />
            </TabsContent>

            <TabsContent value="transacoes">
              <TransacoesTab user={user} />
            </TabsContent>

            <TabsContent value="assinatura">
              <AssinaturaTab user={user} />
            </TabsContent>

            <TabsContent value="seguranca">
              <SegurancaTab user={user} onSignOut={signOut} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
