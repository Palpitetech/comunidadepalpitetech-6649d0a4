import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, ShoppingCart, Radio, Users, Menu } from "lucide-react";
import { useMobileNav } from "@/hooks/useMobileNav";

interface NavButtonProps {
  to?: string;
  icon: any;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  variant?: "default" | "menu";
}

function NavButton({ to, icon: Icon, label, isActive, onClick, variant = "default" }: NavButtonProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-1">
      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );

  if (variant === "menu") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex-1 flex items-center justify-center h-full transition-colors",
          isActive ? "bg-primary/10" : "hover:bg-accent/50"
        )}
      >
        <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </button>
    );
  }

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="flex-1 flex items-center justify-center h-full transition-colors hover:bg-accent/50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center h-full transition-colors hover:bg-accent/50"
    >
      {content}
    </button>
  );
}

export function AdminMobileBottomBar() {
  const location = useLocation();
  const { openDrawer, isDrawerOpen, drawerView } = useMobileNav();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border shadow-lg">
      <div 
        className="flex items-center justify-around h-16 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <NavButton 
          to="/admin/eventos" 
          icon={Activity} 
          label="Eventos" 
          isActive={isActive("/admin/eventos")} 
        />
        <NavButton 
          to="/admin/vendas" 
          icon={ShoppingCart} 
          label="Vendas" 
          isActive={isActive("/admin/vendas")} 
        />
        <NavButton 
          onClick={() => openDrawer('comunicacao')} 
          icon={Radio} 
          label="Comunicação" 
          isActive={isDrawerOpen && drawerView === 'comunicacao'} 
        />
        <NavButton 
          to="/admin/usuarios" 
          icon={Users} 
          label="Usuários" 
          isActive={isActive("/admin/usuarios")} 
        />
        <NavButton 
          onClick={() => openDrawer('root')} 
          icon={Menu} 
          label="Menu" 
          isActive={isDrawerOpen && drawerView === 'root'} 
          variant="menu"
        />
      </div>
    </div>
  );
}
