import { useAuthContext } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

import { TransacoesTab } from "@/components/perfil/TransacoesTab";

export default function PerfilTransacoes() {
  const { profile, user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Transações</h1>
          <div className="w-10" />
        </div>
      </header>
      <ScrollArea className="flex-1">
        <div className="pb-8 max-w-lg mx-auto w-full">
          
          <TransacoesTab user={user} />
        </div>
      </ScrollArea>
    </div>
  );
}
