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
    <div className="min-h-screen bg-muted/30 flex flex-col animate-in fade-in duration-500">
      {/* Header fixo no topo */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center h-16 px-4 max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-full hover:bg-muted active:scale-90 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-center mr-9 text-base font-bold text-foreground">
            Meus Dados
          </h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Profile Card */}
        <section className="bg-background rounded-3xl p-6 shadow-sm border border-border/40 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-full blur-sm" />
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg relative ring-2 ring-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                {getInitials(profile?.nome)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              {profile?.nome || "Usuário"}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 px-3 py-1 rounded-full inline-block">
              Conta Principal
            </p>
          </div>
        </section>

        {/* Data Section */}
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <MeusDadosTab profile={profile} user={user} />
        </div>

        {/* Footer Info */}
        <footer className="pt-4 pb-8 text-center">
          <p className="text-[11px] text-muted-foreground font-medium opacity-60">
            Suas informações estão seguras e protegidas.
          </p>
        </footer>
      </main>
    </div>
  );
}
