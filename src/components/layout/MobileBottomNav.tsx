import { Users, Menu, Trophy, Dices, MessageCircle } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16">
        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/comunidade") || isActive("/") || isActive("/home")
              ? "text-primary scale-110"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold leading-tight">Estudos</span>
        </Link>

        <Link
          to="/gerar-jogos"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/gerar-jogos")
              ? "text-primary scale-110"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Dices className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold leading-tight text-center px-1">Gerar Jogos</span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/chat")
              ? "text-primary scale-110"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold leading-tight">Chat IA</span>
        </Link>

        <Link
          to="/boloes"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 relative",
            isActive("/boloes")
              ? "text-primary scale-110"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="absolute top-1 right-2 text-[6px] font-bold text-white bg-accent rounded-full px-1 py-0.5 animate-pulse">BREVE</span>
          <Trophy className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold leading-tight">Bolões</span>
        </Link>

        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 text-muted-foreground hover:text-foreground"
        >
          <div className="bg-muted/50 p-1.5 rounded-xl">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] mt-1 font-semibold leading-tight">Mais</span>
        </button>
      </div>
    </nav>
  );
}
