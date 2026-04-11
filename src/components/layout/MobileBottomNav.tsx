import { Users, Menu, Calendar, MessageCircle, Save, Trophy, Home, LayoutGrid } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-lg border-t border-slate-100 safe-area-bottom pb-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 relative",
            isActive("/") 
              ? "text-primary scale-110" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Home className={cn("h-6 w-6 mb-1", isActive("/") ? "fill-primary/10" : "")} />
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">Início</span>
          {isActive("/") && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />}
        </Link>

        <Link
          to="/comunidade"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 relative",
            isActive("/comunidade") || isActive("/home")
              ? "text-primary scale-110"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Users className={cn("h-6 w-6 mb-1", isActive("/comunidade") || isActive("/home") ? "fill-primary/10" : "")} />
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">Feed</span>
          {(isActive("/comunidade") || isActive("/home")) && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />}
        </Link>

        <Link
          to="/proximos-concursos"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 relative",
            isActive("/proximos-concursos")
              ? "text-primary scale-110"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Calendar className={cn("h-6 w-6 mb-1", isActive("/proximos-concursos") ? "fill-primary/10" : "")} />
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">Agenda</span>
          {isActive("/proximos-concursos") && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />}
        </Link>

        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 relative",
            isActive("/chat")
              ? "text-primary scale-110"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <MessageCircle className={cn("h-6 w-6 mb-1", isActive("/chat") ? "fill-primary/10" : "")} />
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">Chat</span>
          {isActive("/chat") && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />}
        </Link>

        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 text-slate-400 hover:text-slate-600 group"
        >
          <div className="h-10 w-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center -mt-8 mb-1 group-hover:rotate-12 transition-transform">
             <LayoutGrid className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">Mais</span>
        </button>
      </div>
    </nav>
  );
}