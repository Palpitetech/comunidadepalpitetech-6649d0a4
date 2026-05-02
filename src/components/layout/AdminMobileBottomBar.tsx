/**
 * AdminMobileBottomBar - Barra de navegação inferior exclusiva para Mobile.
 * Visível apenas em telas menores que 'md' (768px).
 * Controla as ações rápidas e o acionamento do Drawer principal.
 */
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, ShoppingCart, Radio, Users, Menu, LayoutDashboard } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px]">
      <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );

  const baseClassName = "flex-1 flex items-center justify-center h-full transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  if (variant === "menu") {
    return (
      <button
        onClick={onClick}
        aria-label={`Abrir ${label}`}
        aria-expanded={isActive}
        className={cn(
          baseClassName,
          isActive ? "bg-primary/10" : ""
        )}
      >
        <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-sm transition-transform active:scale-95">
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
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        className={baseClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={baseClassName}
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div 
        className="flex items-center justify-around h-16 landscape:h-14 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <NavButton 
          to="/admin" 
          icon={LayoutDashboard} 
          label="Painel" 
          isActive={isActive("/admin")} 
        />

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
          to="/admin/whatsapp" 
          icon={Radio} 
          label="Comunic." 
          isActive={isActive("/admin/whatsapp")} 
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

