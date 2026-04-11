import { useAuthContext } from "@/contexts/AuthContext";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MeusDadosTab } from "@/components/perfil/MeusDadosTab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PerfilDados() {
  const { profile, user } = useAuthContext();
  const navigate = useNavigate();

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in slide-in-from-right duration-300">
      <header className="shrink-0 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="h-10 w-10 rounded-full hover:bg-muted transition-colors active:scale-90 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight text-foreground/90">Meus Dados</h1>
          </div>
          <div className="">
            <Avatar className="h-9 w-9 border-2 border-primary/20 ring-1 ring-background">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {getInitials(profile?.nome)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="pb-10 max-w-lg mx-auto w-full px-4">
          {/* Header Visual Compacto */}
          <div className="pt-8 pb-4 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary/30 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Avatar className="h-20 w-20 border-4 border-background shadow-xl relative">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-black">
                  {getInitials(profile?.nome)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {profile?.nome || "Usuário"}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Conta Principal
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <MeusDadosTab profile={profile} user={user} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
