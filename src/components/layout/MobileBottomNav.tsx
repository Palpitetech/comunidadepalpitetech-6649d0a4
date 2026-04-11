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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-md border-t border-border/40 safe-area-bottom shadow-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/comunidade") || isActive("/") || isActive("/home")
              ? "text-primary"
              : "text-muted-foreground/60"
          )}
        >
          <Users className="h-5 w-5 stroke-[1.5]" />
          <span className="text-[9px] mt-0.5 font-medium leading-tight">Feed</span>
        </Link>

        <Link
          to="/gerar-jogos"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/gerar-jogos")
              ? "text-primary"
              : "text-muted-foreground/60"
          )}
        >
          <Dices className="h-5 w-5 stroke-[1.5]" />
          <span className="text-[9px] mt-0.5 font-medium leading-tight text-center">Jogos</span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/chat")
              ? "text-primary"
              : "text-muted-foreground/60"
          )}
        >
          <MessageCircle className="h-5 w-5 stroke-[1.5]" />
          <span className="text-[9px] mt-0.5 font-medium leading-tight">IA</span>
        </Link>

        <Link
          to="/boloes"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
            isActive("/boloes")
              ? "text-primary"
              : "text-muted-foreground/60"
          )}
        >
          <Trophy className="h-5 w-5 stroke-[1.5]" />
          <span className="text-[9px] mt-0.5 font-medium leading-tight">Bolões</span>
        </Link>

        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 text-muted-foreground/60"
        >
          <Menu className="h-5 w-5 stroke-[1.5]" />
          <span className="text-[9px] mt-0.5 font-medium leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
