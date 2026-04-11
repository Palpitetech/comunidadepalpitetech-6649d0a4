import { useAuthContext } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-secondary/30 flex flex-col animate-in fade-in duration-500 pb-10">
      {/* Header com Safe Area */}
      <header className="sticky top-0 z-30 w-full bg-background border-b border-border shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center h-16 px-6 max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-xl hover:bg-muted active:scale-95 transition-all -ml-2 h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          <h1 className="flex-1 text-center mr-10 text-xl font-black text-foreground tracking-tight">
            Meus Dados
          </h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 space-y-10">
        {/* Profile Card - Modern & High Contrast */}
        <section className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Avatar className="h-28 w-28 border-4 border-background shadow-2xl relative ring-2 ring-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-black">
                {getInitials(profile?.nome)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {profile?.nome || "Usuário"}
            </h2>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20">
              <span className="text-xs font-black uppercase tracking-[0.15em]">
                Conta Verificada
              </span>
            </div>
          </div>
        </section>

        {/* Data Sections */}
        <div className="animate-in slide-in-from-bottom-8 duration-1000">
          <MeusDadosTab profile={profile} user={user} />
        </div>

        {/* Support Link */}
        <div className="pt-6 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground/80 font-semibold text-center max-w-[280px]">
            Precisa alterar algum dado que não está disponível para edição?
          </p>
          <Button variant="link" className="text-primary font-bold text-base h-auto p-0">
            Falar com suporte
          </Button>
        </div>
      </main>
    </div>
  );
}
