import { Users, Bell, Menu, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdminRoute = currentPath.startsWith('/admin');

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {/* Comunidade (Início) */}
        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors",
            isActive("/comunidade") || isActive("/")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Comunidade</span>
        </Link>

        {/* Chat */}
        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors",
            isActive("/chat")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Chat</span>
        </Link>

        {/* Alertas */}
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
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors",
            isAdminRoute 
              ? "text-destructive" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Menu className="h-6 w-6" />
            {isAdminRoute && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
            )}
          </div>
          <span className="text-xs mt-1 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
