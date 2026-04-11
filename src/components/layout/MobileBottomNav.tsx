import { Users, Menu, Calendar, MessageCircle, Save, Trophy, Dices } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border safe-area-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isActive("/comunidade") || isActive("/")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Estudos</span>
        </Link>

        <Link
          to="/gerar-jogos"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors relative",
            isActive("/gerar-jogos")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Dices className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Gerar Jogos</span>
        </Link>

        <Link
          to="/boloes"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors relative",
            isActive("/boloes")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="absolute -top-0.5 right-1 text-[7px] font-bold text-accent bg-accent/15 rounded px-1">BREVE</span>
          <Trophy className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Bolões</span>
        </Link>

        <Link
          to="/proximos-concursos"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isActive("/proximos-concursos")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Concursos</span>
        </Link>

        <Link
          to="/meus-palpites"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isActive("/meus-palpites")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Save className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Salvos</span>
        </Link>

        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Ferramentas</span>
        </button>
      </div>
    </nav>
  );
}
