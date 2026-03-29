import { Users, Menu, Calendar, MessageCircle } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border safe-area-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        {/* Comunidade */}
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
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Comunidade</span>
        </Link>

        {/* Próximos Concursos */}
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

        {/* Chat */}
        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isActive("/chat")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Chat</span>
        </Link>

        {/* Menu */}
        <button
          onClick={onMenuClick}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isAdminRoute 
              ? "text-destructive" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Menu className="h-5 w-5" />
            {isAdminRoute && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
