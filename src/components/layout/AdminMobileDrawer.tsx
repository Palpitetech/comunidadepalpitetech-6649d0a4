/**
 * AdminMobileDrawer - Menu lateral (Drawer) para Mobile.
 * Acionado pela BottomBar em telas < md.
 * Suporta navegação em múltiplos níveis (ex: Comunicação).
 * Consome 'adminNavConfig' para manter paridade com o Desktop.
 */
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Zap, ArrowLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { adminNavConfig, type NavSection, type NavItem } from "@/config/adminNavConfig";
import { useAdminBadges } from "@/hooks/useAdminBadges";
import { type DrawerView } from "@/hooks/useMobileNav";
import { AppVersion } from "./AppVersion";



interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  view: DrawerView;
  onViewChange: (view: DrawerView) => void;
}


export function AdminMobileDrawer({ isOpen, onClose, view, onViewChange }: AdminMobileDrawerProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: badges } = useAdminBadges();
  const [searchOpen, setSearchOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // Se arrastar mais de 60px para a esquerda, fecha o drawer
    if (diff > 60) {
      onClose();
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };


  const initials = (profile?.nome || user?.email || "A")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location.pathname === url;
    return location.pathname.startsWith(url) && (url !== '/admin' || location.pathname === '/admin');
  };

  const handleNavigate = (url: string) => {
    onClose();
    navigate(url);
  };

  const handleSearchClick = () => {
    onClose();
    setSearchOpen(true);
  };

  const handleGoBackApp = () => {
    onClose();
    navigate("/");
  };


  const NavBadge = ({ count, tone = "info" }: { count: number; tone?: "danger" | "info" }) => {
    if (!count) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.1rem] h-[1.1rem] text-[10px] font-semibold leading-none",
          tone === "danger"
            ? "bg-destructive/15 text-destructive"
            : "bg-primary/15 text-primary"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const RenderNavItem = ({ item }: { item: NavItem }) => {
    const active = isActive(item.url, item.exact);
    const badgeCount = item.badge ? badges?.[item.badge] ?? 0 : 0;

    return (
      <button
        onClick={() => handleNavigate(item.url)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-md transition-colors",
          active ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className={cn("h-4.5 w-4.5", active ? "text-primary" : "text-muted-foreground")} />
          <span>{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badgeCount > 0 && <NavBadge count={badgeCount} tone={item.badgeTone} />}
          <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
        </div>
      </button>
    );
  };

  const getSubmenuContent = () => {
    const section = adminNavConfig.find(s => s.id === view);
    if (!section) return null;

    return (
      <div className="w-1/2 h-full flex flex-col">
        <div className="px-4 py-2 flex items-center gap-2 border-b bg-accent/30">
          <Button variant="ghost" size="icon" onClick={() => onViewChange('root')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{section.label}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-4">
            {section.items.map((item) => (
              <RenderNavItem key={item.url} item={item} />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="left" 
          className="p-0 w-[280px] flex flex-col border-r shadow-2xl focus:outline-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Menu de navegação"
        >
          <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">Painel</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                    Admin
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Search Trigger */}
          <div className="px-4 py-3">
            <button
              onClick={handleSearchClick}
              className="flex w-full items-center gap-2 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Buscar página...</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div 
              className={cn(
                "h-full w-[200%] flex transition-transform duration-300 ease-in-out",
                view !== 'root' ? "-translate-x-1/2" : "translate-x-0"
              )}
            >
              {/* Root View */}
              <div className="w-1/2 h-full flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-6 p-4">
                    {adminNavConfig.map((section) => {
                      if (section.inline) {
                        return (
                          <div key={section.id} className="space-y-1">
                            {section.items.map((item) => (
                              <RenderNavItem key={item.url} item={item} />
                            ))}
                          </div>
                        );
                      }

                      const sectionBadgeTotal = section.items.reduce(
                        (sum, i) => sum + (i.badge ? badges?.[i.badge] ?? 0 : 0),
                        0
                      );

                      return (
                        <div key={section.id} className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                            {section.label}
                          </p>
                          <button 
                            onClick={() => onViewChange(section.id as DrawerView)}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-md transition-colors",
                              section.items.some(i => isActive(i.url)) ? "bg-accent/50 text-foreground" : "hover:bg-accent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {section.icon && <section.icon className="h-4.5 w-4.5 text-muted-foreground" />}
                              <span>{section.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {sectionBadgeTotal > 0 && <NavBadge count={sectionBadgeTotal} tone="danger" />}
                              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Dynamic Submenu View */}
              {getSubmenuContent()}
            </div>
          </div>

          <div className="p-4 border-t bg-accent/10">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/15 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold truncate">
                  {profile?.nome || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate block">
                  {user?.email}
                </span>
                <AppVersion className="mt-1" />
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-9 text-xs" 
              onClick={handleGoBackApp}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao app
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AdminCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
