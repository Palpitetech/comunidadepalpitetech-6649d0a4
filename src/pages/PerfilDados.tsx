import { useAuthContext } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

import { MeusDadosTab } from "@/components/perfil/MeusDadosTab";

export default function PerfilDados() {
  const { profile, user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in slide-in-from-right duration-300">
      <header className="shrink-0 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="h-10 w-10 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold tracking-tight">Meus Dados</h1>
          <div className="w-10" />
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="pb-20 max-w-lg mx-auto w-full">
          <MeusDadosTab profile={profile} user={user} />
        </div>
      </ScrollArea>
    </div>
  );
}
