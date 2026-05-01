import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Zap, ArrowLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'root' | 'comunicacao';
  onViewChange: (view: 'root' | 'comunicacao') => void;
}

export function AdminMobileDrawer({ isOpen, onClose, view, onViewChange }: AdminMobileDrawerProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = (profile?.nome || user?.email || "A")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="p-0 w-[280px] flex flex-col border-r shadow-2xl">
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
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-2 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Buscar página...</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* Sliding Views Container */}
            <div 
              className={cn(
                "h-full w-[200%] flex transition-transform duration-300 ease-in-out",
                view === 'comunicacao' ? "-translate-x-1/2" : "translate-x-0"
              )}
            >
              {/* Root View */}
              <div className="w-1/2 h-full flex flex-col">
                <ScrollArea className="flex-1 px-2">
                  <div className="space-y-1 p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Geral</p>
                    <Link to="/admin" onClick={onClose} className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                      <span>Painel Principal</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                    <Link to="/admin/usuarios" onClick={onClose} className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                      <span>Gestão de Usuários</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                    
                    <div className="pt-4">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Modulos</p>
                      <button 
                        onClick={() => onViewChange('comunicacao')}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      >
                        <span>Comunicação</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </button>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Comunicacao View */}
              <div className="w-1/2 h-full flex flex-col">
                <div className="px-4 py-2 flex items-center gap-2 border-b bg-accent/30">
                  <Button variant="ghost" size="icon" onClick={() => onViewChange('root')} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">Comunicação</span>
                </div>
                <ScrollArea className="flex-1 px-2">
                  <div className="space-y-1 p-2">
                    <Link to="/admin/chat" onClick={onClose} className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                      <span>Chat Central</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                    <Link to="/admin/whatsapp" onClick={onClose} className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                      <span>WhatsApp Marketing</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                    <Link to="/admin/eventos" onClick={onClose} className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                      <span>Logs de Eventos</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </div>
                </ScrollArea>
              </div>
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
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">
                  {profile?.nome || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-9 text-xs" 
              onClick={() => {
                onClose();
                navigate("/");
              }}
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
