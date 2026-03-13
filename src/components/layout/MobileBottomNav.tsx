import { Users, Ticket, Menu, MessageCircle, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdminRoute = currentPath.startsWith('/admin');
  const { isAdmin } = useUserRole();

  const isActive = (path: string) => currentPath === path;

  const handleComingSoonClick = (e: React.MouseEvent, label: string) => {
    if (!isAdmin) {
      e.preventDefault();
      toast.info(`${label} estará disponível em breve! 🚀`);
    }
  };

  const comingSoonBadge = (
    <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-[8px] font-bold px-1 rounded leading-tight">
      BREVE
    </span>
  );

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

        {/* WhatsApp */}
        <a
          href="https://chat.whatsapp.com/J89dx46Lo97G9YdAaGmR78"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors text-muted-foreground hover:text-accent"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">WhatsApp</span>
        </a>

        {/* Chat */}
        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors",
            isActive("/chat")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Chat</span>
        </Link>

        {/* Bolões - Em Breve */}
        <Link
          to={isAdmin ? "/boloes" : "#"}
          onClick={(e) => handleComingSoonClick(e, "Bolões")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors relative",
            isActive("/boloes")
              ? "text-primary"
              : "text-muted-foreground/50 hover:text-muted-foreground"
          )}
        >
          <div className="relative">
            <Ticket className="h-5 w-5" />
            {comingSoonBadge}
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-tight">Bolões</span>
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
