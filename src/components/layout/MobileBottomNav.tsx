import { Users, PlusCircle, Bell, Menu } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {/* Comunidade */}
        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors",
            isActive("/comunidade")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Comunidade</span>
        </Link>

        {/* Criar Post - Botão Central Destacado */}
        <Link
          to="/criar-post"
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[72px] py-2"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg -mt-4">
            <PlusCircle className="h-7 w-7" />
          </div>
          <span className="text-xs mt-1 font-medium text-accent">Criar</span>
        </Link>

        {/* Notificações */}
        <Link
          to="/notificacoes"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors",
            isActive("/notificacoes")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Alertas</span>
        </Link>

        {/* Menu */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
